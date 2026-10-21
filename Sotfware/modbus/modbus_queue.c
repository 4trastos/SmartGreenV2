#include "../incl/smartgreen.h"

int     ft_modbus_queue_init(t_modbus_queue *queue)
{
    queue->head = NULL;
    queue->tail = NULL;
    queue->size = 0;
    queue->stop = 0;

    pthread_mutex_init(&queue->mutex, NULL);
    pthread_cond_init(&queue->cond, NULL);

    return (0);
}

void    ft_modbus_queue_destroy(t_modbus_queue *queue)
{
    t_modbus_cmd    *cmd;
    t_modbus_cmd    *next;

    pthread_mutex_lock(&queue->mutex);
    cmd = queue->head;
    while (cmd)
    {
        next = cmd->next;
        free(cmd);
        cmd = next;
    }
    pthread_mutex_unlock(&queue->mutex);
    pthread_mutex_destroy(&queue->mutex);
    pthread_cond_destroy(&queue->cond);
}

int     ft_modbus_enqueue(t_modbus_queue *queue, t_modbus_cmd_type type, int unit_id, int addr, int value)
{
    t_modbus_cmd    *cmd;

    cmd = malloc(sizeof(t_modbus_cmd));
    if (!cmd)
        return (-1);

    cmd->type = type;
    cmd->unit_id = unit_id;
    cmd->addr = addr;
    cmd->value = value;
    cmd->next = NULL;

    pthread_mutex_lock(&queue->mutex);

    if (type == CMD_HEARTBEAT && queue->head != NULL)
    {
        cmd->next = queue->head;
        queue->head = cmd;
    }
    else if (queue->tail == NULL)            // Cola vacía
    {
        queue->head = cmd;
        queue->tail = cmd;
    }
    else
    {
        queue->tail->next = cmd;
        queue->tail = cmd;
    }
    queue->size++;

    pthread_cond_signal(&queue->cond);      // despertar al worker
    pthread_mutex_unlock(&queue->mutex);
    return (0);
}

t_modbus_cmd    *ft_modbus_dequeue(t_modbus_queue *queue)
{
    t_modbus_cmd    *cmd = queue->head;
    if (!cmd)
        return (NULL);

    queue->head = cmd->next;
    if (queue->head == NULL)
        queue->tail = NULL;
    queue->size--;
    cmd->next = NULL;
    return(cmd);
}

// Worker thread — el ÚNICO que habla al bus RS485
// void    *ft_modbus_worker(void *arg)
// {
//     t_smartgreen    *smartgreen = (t_smartgreen *)arg;
//     t_modbus_queue  *queue = &smartgreen->modbus_queue;
//     t_modbus_cmd    *cmd;

//     printf("MODBUS WORKER: arrancado\n"); fflush(stdout);

//     while (1)
//     {
//         pthread_mutex_lock(&queue->mutex);
//         while (queue->head == NULL && !queue->stop)
//             pthread_cond_wait(&queue->cond, &queue->mutex);

//         if (queue->stop && queue->head == NULL)
//         {
//             pthread_mutex_unlock(&queue->mutex);
//             break;
//         }

//         cmd = ft_modbus_dequeue(queue);
//         pthread_mutex_unlock(&queue->mutex);

//         if (!cmd)
//             continue;

//         if (!smartgreen->modbus_ctx)
//         {
//             ft_modbus_init(smartgreen);
//             if (!smartgreen->modbus_ctx)
//             {
//                 free(cmd);
//                 continue;
//             }
//         }

//         switch (cmd->type)
//         {
//             case CMD_HEARTBEAT:
//             case CMD_WRITE:
//             {                                  
//                 int cidx = ft_find_cooler(smartgreen, cmd->unit_id);
//                 if (cidx != -1 && ((smartgreen->coolers[cidx].broken_cooler && !ft_is_safe_write(cmd->addr, cmd->value))
//                      || ((smartgreen->coolers[cidx].fault_solenoid || smartgreen->coolers[cidx].fault_pump) && cmd->addr == 50 && (cmd->value & 0x0F))))           // solo FAN: ni bomba ni solenoide
//                 {
//                     printf("MODBUS BLOQUEADO (averia) -> unit=%d addr=%d value=%d\n", cmd->unit_id, cmd->addr, cmd->value); fflush(stdout);
//                     break;
//                 }
//                 modbus_set_slave(smartgreen->modbus_ctx, cmd->unit_id);
//                 printf("MODBUS WRITE -> unit=%d addr=%d value=%d\n", cmd->unit_id, cmd->addr, cmd->value); fflush(stdout);
//                 {
//                     int tries = 0;
//                     int rc;

//                     do
//                     {
//                         rc = modbus_write_registers(smartgreen->modbus_ctx, cmd->addr, 1, (uint16_t[]){(uint16_t)cmd->value});
//                         if (rc == -1)
//                         {
//                             printf("MODBUS WRITE error addr=%d (intento %d/3): %s\n", cmd->addr, tries + 1, modbus_strerror(errno)); fflush(stdout);
//                             modbus_flush(smartgreen->modbus_ctx);       // descarta restos de la trama fallida
//                             usleep(300000);                             // 300 ms antes de reintentar
//                         }
//                     } while (rc == -1 && ++tries < 3);

//                     if (rc == -1)
//                         printf("MODBUS WRITE FALLIDA definitivamente addr=%d value=%d\n", cmd->addr, cmd->value);
//                 }
//                 fflush(stdout);
//                 break;
//             }                         

//             case CMD_READ_COOLER:
//                 ft_modbus_read_cooler(smartgreen, cmd->unit_id);
//                 break;

//             case CMD_READ_SENSOR:
//                 ft_modbus_read_sensor(smartgreen, cmd->unit_id);
//                 break;
//         }
//         usleep(150000);
//         free(cmd);
//     }

//     printf("MODBUS WORKER: parado\n"); fflush(stdout);
//     return (NULL);
// }

void    *ft_modbus_worker(void *arg)
{
    t_smartgreen    *smartgreen = (t_smartgreen *)arg;
    t_modbus_queue  *queue = &smartgreen->modbus_queue;
    t_modbus_cmd    *cmd;

    printf("MODBUS WORKER: arrancado\n"); fflush(stdout);

    while (1)
    {
        pthread_mutex_lock(&queue->mutex);
        while (queue->head == NULL && !queue->stop)
            pthread_cond_wait(&queue->cond, &queue->mutex);

        if (queue->stop && queue->head == NULL)
        {
            pthread_mutex_unlock(&queue->mutex);
            break;
        }

        cmd = ft_modbus_dequeue(queue);
        pthread_mutex_unlock(&queue->mutex);

        if (!cmd)
            continue;

        if (!smartgreen->modbus_ctx)
        {
            ft_modbus_init(smartgreen);
            if (!smartgreen->modbus_ctx)
            {
                free(cmd);
                continue;
            }
        }

        switch (cmd->type)
        {
            case CMD_HEARTBEAT:
            case CMD_WRITE:
            {
                int cidx = ft_find_cooler(smartgreen, cmd->unit_id);

                // Averías: no dejar encender un cooler averiado ni abrir agua con aviso de solenoide/bomba
                if (cidx != -1 && ((smartgreen->coolers[cidx].broken_cooler && !ft_is_safe_write(cmd->addr, cmd->value))
                    || ((smartgreen->coolers[cidx].fault_solenoid || smartgreen->coolers[cidx].fault_pump) && cmd->addr == 50 && (cmd->value & 0x0F))))           // solo FAN: ni bomba ni solenoide
                {
                    printf("MODBUS BLOQUEADO (averia) -> unit=%d addr=%d value=%d\n", cmd->unit_id, cmd->addr, cmd->value); fflush(stdout);
                    break;
                }

                // Heartbeat: si esta placa no lo acepta, no se envía
                if (cmd->type == CMD_HEARTBEAT && cidx != -1 && smartgreen->coolers[cidx].hb_disabled)
                    break;

                modbus_set_slave(smartgreen->modbus_ctx, cmd->unit_id);
                printf("MODBUS WRITE -> unit=%d addr=%d value=%d\n", cmd->unit_id, cmd->addr, cmd->value); fflush(stdout);
                {
                    int tries = 0;
                    int max_tries = (cmd->type == CMD_HEARTBEAT) ? 1 : 3;     // heartbeat sin reintentos
                    int rc;

                    do
                    {
                        rc = modbus_write_registers(smartgreen->modbus_ctx, cmd->addr, 1, (uint16_t[]){(uint16_t)cmd->value});
                        if (rc == -1)
                        {
                            printf("MODBUS WRITE error addr=%d (intento %d/%d): %s\n", cmd->addr, tries + 1, max_tries, modbus_strerror(errno)); fflush(stdout);
                            modbus_flush(smartgreen->modbus_ctx);       // descarta restos de la trama fallida
                            if (tries + 1 < max_tries)
                                usleep(300000);                         // 300 ms antes de reintentar
                        }
                    } while (rc == -1 && ++tries < max_tries);

                    if (rc == -1 && cmd->type != CMD_HEARTBEAT)
                        printf("MODBUS WRITE FALLIDA definitivamente addr=%d value=%d\n", cmd->addr, cmd->value);

                    // Heartbeat: contar fallos SOLO si la placa contesta a las lecturas (si no, es un corte de comunicación)
                    if (cmd->type == CMD_HEARTBEAT && cidx != -1)
                    {
                        t_cooler_state *c = &smartgreen->coolers[cidx];

                        if (rc == -1 && time(NULL) - c->last_ok_read < 10)
                        {
                            if (++c->hb_fail >= 3 && !c->hb_disabled)
                            {
                                c->hb_disabled = 1;
                                printf("[HEARTBEAT] desactivado unit=%d: la placa no lo acepta\n", cmd->unit_id);
                            }
                        }
                        else if (rc != -1)
                            c->hb_fail = 0;
                    }
                }
                fflush(stdout);
                break;
            }

            case CMD_READ_COOLER:
                ft_modbus_read_cooler(smartgreen, cmd->unit_id);
                break;

            case CMD_READ_SENSOR:
                ft_modbus_read_sensor(smartgreen, cmd->unit_id);
                break;
        }
        usleep(150000);
        free(cmd);
    }

    printf("MODBUS WORKER: parado\n"); fflush(stdout);
    return (NULL);
}

// Parar el worker
void    ft_modbus_queue_stop(t_modbus_queue *queue)
{
    pthread_mutex_lock(&queue->mutex);
    queue->stop = 1;
    pthread_cond_signal(&queue->cond);
    pthread_mutex_unlock(&queue->mutex);
}