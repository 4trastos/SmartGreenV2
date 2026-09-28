NAME = smartgreen

# Compilación Nativa (Rasberry Pi actual) 
CC = gcc
# Cross-Compilation ARM 32-bits (Descomentar para producción)
#CC = arm-linux-gnueabihf-gcc
# Cross-Compilation ARM 64-bits (Descomentar para producción)
#CC = aarch64-linux-gnu-gcc

DB_DIR = /var/lib/smartgreen

LDLIBS = -lmodbus -lsqlite3 -lm -lpthread -lmicrohttpd -lwebsockets -lssl -lcrypto -lcurl -ljson-c

# Flags del preprocesador (Include y Defines)
CPPFLAGS = -Iincl -I/usr/include/modbus -DDATA_DIR=\"$(DB_DIR)\"

# Flags del compilador (Opciones y Advertencias)
CFLAGS = -Wall -Werror -Wextra #-Wpadded
DFLAGS = -Wall -Werror -Wextra -g3 -fsanitize=address -O0
SFLAGS = -s

RM = rm -f

COMMON_SRC = api/api_server.c api/api_connect.c api/api_response.c api/api_post.c api/api_ws.c api/api_broadcast.c api/api_delete.c api/api_setup.c \
		control/cooler.c control/error_control.c control/scheduler.c control/sensor.c control/signal.c control/maintenance.c control/alarms.c control/users.c \
		db/database.c db/schema.c db/config.c  db/error.c \
		modbus/modbus_client.c modbus/registers.c modbus/calculators.c modbus/modbus_queue.c \
		utils/utils.c \
		update/update.c

SRC = src/main.c $(COMMON_SRC)
OBJTS = $(SRC:.c=.o)

all: setup $(NAME)

$(NAME): $(OBJTS)
	$(CC) $(CFLAGS) $(SFLAGS) $(OBJTS) -o $(NAME) $(LDLIBS)

debug: CFLAGS = $(DFLAGS)
debug:fclean $(OBJTS)
	$(CC) $(CFLAGS) $(OBJTS) -o $(NAME) $(LDLIBS)

%.o: %.c
	$(CC) $(CFLAGS) $(CPPFLAGS) -c $< -o $@

setup:
	@mkdir -p $(DB_DIR)
	@sudo chown $$USER:$$USER $(DB_DIR)
	
clean:
	$(RM) $(OBJTS)

fclean: clean
	$(RM) $(NAME)

re: fclean all

.PHONY: all clean fclean re setup debug