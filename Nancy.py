import pygame
import sys
import random

pygame.init()

# background image
background = pygame.image.load("background.jpg")
bg_width, bg_height = background.get_size()
screen = pygame.display.set_mode((bg_width, bg_height))
pygame.display.set_caption("Garbage Classification")

# scotty dog image
scotty = pygame.image.load("scotty.webp")
scotty = pygame.transform.scale(scotty, (200, 150))

#scotty parameters
x = bg_width // 2
y = bg_height // 2
speed = 5

# recycle bin image
recycle_bin = pygame.image.load("recycle_bin.webp")
recycle_bin = pygame.transform.scale(recycle_bin, (180, 200))

# category
recycle_trash = ["coke_can.jpg", "water_bottle.jpg"]
kitchen_trash = ["apple.jpg", "used_tissue.jpg", "abp.jpg"]
hazardous_trash = ["battery.jpg", "chargers.jpg", "computer_screen.jpg", "paint,jpg"]
landfill_trash = ["candy.wrap.jpg", "plastic_bag.jpg", "clothing.jpg"]

# trash images
trash = ["apple.jpg"]
trash_index = random.randint(0, 0)
trash_image = trash[trash_index]
trash = pygame.image.load(trash_image)
trash = pygame.transform.scale(trash, (60, 60))

# trash parameters
trash_x = random.randint(0, bg_width - 60)
trash_y = -60
trash_speed = 4

# other
holding_trash = False
score = 0

font = pygame.font.SysFont(None, 48)

clock = pygame.time.Clock()

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

    keys = pygame.key.get_pressed()

    if keys[pygame.K_w]:
        y -= speed
    if keys[pygame.K_s]:
        y += speed
    if keys[pygame.K_a]:
        x -= speed
    if keys[pygame.K_d]:
        x += speed

    #trash falls
    if not holding_trash:
        trash_y += trash_speed

    # reset if missed
    if trash_y > bg_height:
        trash_x = random.randint(0, bg_width - 60)
        trash_y = -60
    
    # rectangle for collision
    scotty_rect = pygame.Rect(x, y, 200, 150)
    trash_rect = pygame.Rect(trash_x, trash_y, 60, 60)
    recycle_bin_rect = pygame.Rect(320, 250, 200, 250)

    # pick up trash
    if scotty_rect.colliderect(trash_rect):
        holding_trash = True

    # if holding, trash follows scotty
    if holding_trash:
        trash_x = x + 70
        trash_y = y - 40

        # drop into recycle bin
        if scotty_rect.colliderect(recycle_rect):
            score += 1
            holding_trash = False
            trash_x = random.randint(0, bg_width - 60)
            trash_y = -60

    # draw everything
    screen.blit(background, (0, 0))
    screen.blit(scotty, (x, y))
    screen.blit(recycle_bin, (320, 250))
    screen.blit(trash, (trash_x, trash_y))

    # draw score
    score_text = font.render(f"Score: {score}", True, (0, 0, 0))
    screen.blit(score_text, (20, 20))
    
    pygame.display.update()
    clock.tick(60)
