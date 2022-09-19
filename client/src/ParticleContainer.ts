import { SPRITE } from "../../shared/Sprite";
import { AnimEasing, EASING_FUNCTIONS } from "./Animation/AnimUtils";
import { worldLayer2 } from "./GameClient";
import { mSprite } from "./Renderer";
import { Sprites } from "./Sprites";

function rng(min: number, max: number) {
    return min + Math.random() * (max - min);
}

class Particle {
    maxLife = 0.5;
    life: number = this.maxLife;
    sprite: mSprite;
    angle = Math.random() * 2 * Math.PI;
    velX: number = Math.cos(this.angle) * 5;
    velY: number = Math.sin(this.angle) * 5;

    constructor(spriteId: number, x: number, y: number) {
        const sprite = new mSprite(Sprites[spriteId]);
        this.sprite = sprite;
        sprite.position.x = x;
        sprite.position.y = y;
        worldLayer2.add(sprite);
    }
}

const particles: Particle[] = [];

export function addParticle(spriteId: number, x: number, y: number) {
    const particle = new Particle(spriteId, x, y);
    particles.push(particle);
}

export function ParticleContainer_update(deltaMs: number) {
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.life -= deltaMs;
        if (particle.life < 0) particle.life = 0;

        particle.sprite.position.x += particle.velX;
        particle.sprite.position.y += particle.velY;

        particle.velX *= 0.95;
        particle.velY += 0.01;
        particle.sprite.alpha = EASING_FUNCTIONS[AnimEasing.easeOutQuad](particle.life / particle.maxLife)
    }

    for (let i = 0; i < particles.length;) {
        const particle = particles[i];
        if (particle.life <= 0) {
            particles.splice(i, 1);
            worldLayer2.remove(particle.sprite);
        }
        else i++;
    }
}