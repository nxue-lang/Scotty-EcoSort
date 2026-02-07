import pygame
import sys

pygame.init()

screen = pygame.display.set_mode((1536, 1024))
pygame.display.set_caption("Background")

background = pygame.image.load("background.jpg")

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

    screen.blit(background, (0, 0))
    
    pygame.display.update()