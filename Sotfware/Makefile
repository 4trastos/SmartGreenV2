NAME = smartgreen
TEST_NAME = test

# Compilación Nativa (Rasberry Pi actual) 
CC = gcc
# Cross-Compilation ARM 32-bits (Descomentar para producción)
#CC = arm-linux-gnueabihf-gcc
# Cross-Compilation ARM 64-bits (Descomentar para producción)
#CC = aarch64-linux-gnu-gcc

CFLAGS = -Wall -Wextra -Werror -g3 -s #-Wpadded
INCLUDES = -Iincl -I/usr/include/modbus
LDFLAGS = -lmodbus -lsqlite3 -lm -lpthread -lmicrohttpd -lwebsockets -lssl -lcrypto -lcurl -ljson-c

RM = rm -f
DB_DIR = /var/lib/smartgreen

COMMON_SRC = api/api_server.c api/api_connect.c api/api_response.c api/api_post.c \
		api/api_ws.c api/apì_broadcast.c api/api.delete.c api/api_setup.c \
		control/cooler.c control/error_control.c control/scheduler.c control/sensor.c \
		control/signal.c control/maintenance.c control/alarms.c control/users.c \
		db/database.c db/schema.c db/config.c  db/error.c \
		modbus/modbus_client.c modbus/registers.c modbus/calculators.c modbus/modbus_queue.c \
		utils/utils.c \
		update/update.c

SRC = src/main.c \
		$(COMMON_SRC)

SRC_TEST = tools/test_main.c tools/test_actuators.c tools/test_menu.c tools/test_monitor.c \
		tools/test_report.c tools/test_scan.c tools/test_write.c tools/test_read.c \
		$(COMMON_SRC)

OBJTS = $(SRC:.c=.o)
TEST_OBJS = $(SRC_TEST:.c=.o)

all: setup $(NAME) $(TEST_NAME)

$(NAME): $(OBJTS)
	$(CC) $(CFLAGS) $(OBJTS) -o $@ $(LDFLAGS)

$(TEST_NAME): $(TEST_OBJS)
	$(CC) $(CFLAGS) $(TEST_OBJS) -o $@ $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

setup:
	@mkdir -p $(DB_DIR)
	@sudo chown $$USER:$$USER $(DB_DIR)
	
clean:
	$(RM) $(OBJTS)
	$(RM) $(TEST_OBJS)

fclean: clean
	$(RM) $(NAME)
	$(RM) $(TEST_NAME)

debug: CFLAGS += -fsanitize=address

debug: re

re: fclean all

.PHONY: all clean fclean re setup debug