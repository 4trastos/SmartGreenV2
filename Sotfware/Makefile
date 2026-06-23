NAME = smartgreen

# Compilación Nativa (Rasberry Pi actual) 
CC = gcc
# Cross-Compilation ARM 32-bits (Descomentar para producción)
#CC = arm-linux-gnueabihf-gcc
# Cross-Compilation ARM 64-bits (Descomentar para producción)
#CC = aarch64-linux-gnu-gcc

CFLAGS = -Wall -Wextra -Werror -g3
INCLUDES = -Iincl
LDFLAGS = -lmodbus -lsqlite3 -lm -lpthread

RM = rm -f

SRC = src/main.c \
		api/api_server.c \
		control/cooler.c control/error_control.c control/scheduler.c control/sensor.c \
		db/database.c \
		modbus/modbus_client.c modbus/registers.c \
		utils/utils.c

OBJTS = $(SRC:.c=.o)

all: $(NAME)

$(NAME): $(OBJTS)
	$(CC) $(CFLAGS) $(OBJTS) -o $(NAME) $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

clean:
	$(RM) $(OBJTS)

fclean: clean
	$(RM) $(NAME)

debug: CFLAGS += -fsanitize=address

debug: re

re: fclean all

.PHONY: all clean fclean re