import pygame
import sys

pygame.init()

# 窗口大小（宽，高）
screen = pygame.display.set_mode((400, 300))
pygame.display.set_caption("My Pygame Window")

clock = pygame.time.Clock()

running = True
while running:
    # 处理关闭窗口等事件
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # 填充背景色（RGB）
    screen.fill((30, 30, 30))

    # 把内容真正显示到窗口上
    pygame.display.flip()

    # 限制帧率（60fps）
    clock.tick(60)

pygame.quit()
sys.exit()
