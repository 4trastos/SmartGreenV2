NAME = smartgreen

# Compilación Nativa (Rasberry Pi actual) 
CC = gcc
# Cross-Compilation ARM 32-bits (Descomentar para producción)
#CC = arm-linux-gnueabihf-gcc
# Cross-Compilation ARM 64-bits (Descomentar para producción)
#CC = aarch64-linux-gnu-gcc

CFLAGS = -Wall -Wextra -Werror -g3
INCLUDES = -Iincl -I/usr/include/modbus
LDFLAGS = -lmodbus -lsqlite3 -lm -lpthread -lmicrohttpd -lwebsockets

RM = rm -f
DB_DIR = /var/lib/smartgreen

SRC = src/main.c \
		api/api_server.c api/api_connect.c api/api_response.c api/api_post.c \
		api/api_ws.c api/apì_broadcast.c \
		control/cooler.c control/error_control.c control/scheduler.c control/sensor.c \
		control/signal.c control/maintenance.c control/alarms.c control/users.c \
		db/database.c db/schema.c db/config.c  db/error.c \
		modbus/modbus_client.c modbus/registers.c modbus/calculators.c \
		utils/utils.c

OBJTS = $(SRC:.c=.o)

all: setup  $(NAME)

$(NAME): $(OBJTS)
	$(CC) $(CFLAGS) $(OBJTS) -o $(NAME) $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

setup:
	@mkdir -p $(DB_DIR)
	@sudo chown $$USER:$$USER $(DB_DIR)
	
clean:
	$(RM) $(OBJTS)

fclean: clean
	$(RM) $(NAME)

debug: CFLAGS += -fsanitize=address

debug: re

re: fclean all

.PHONY: all clean fclean re setup debug