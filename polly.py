import pygame
import sys
import Nancy

WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode(WIDTH, HEIGHT)
pygame.display.set_caption("Garbage Classification")

clock = pygame.time.Clock()

title_font = pygame.font.SysFont(None, 72)
text_font = pygame.font.SysFont(None, 32)
button_font = pygame.font.SysFont(None, 40)

title = title_font.render("Garbage Classification Game", True, (0, 0, 0))
description = [
    "Help Scotty sort garbage correctly!",
    "Use W A S D to move.",
    "Pick up trash and drop it into the right bin by approach the bin."
]

start_button = pygame.Rect(WIDTH // 2 - 120, HEIGHT // 2 + 80, 240, 60)

start_text = button_font.render("START GAME", True, (255, 255, 255))

