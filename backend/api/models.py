import random
from django.db import models
from django.conf import settings


class EmailVerificationCode(models.Model):
    PURPOSES = [
        ("email_verify", "Email Verification"),
        ("password_change", "Password Change"),
        ("email_change", "Email Change"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSES, default="email_verify")
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    @classmethod
    def generate_for_user(cls, user, purpose="email_verify"):
        code = f"{random.randint(100000, 999999)}"
        cls.objects.filter(user=user, purpose=purpose, is_used=False).update(is_used=True)
        return cls.objects.create(user=user, code=code, purpose=purpose)

    def __str__(self):
        return f"{self.user.username}: {self.code} ({self.purpose})"


class PickedMovie(models.Model):
    CHOICES = [
        ("saved", "Saved"),
        ("liked", "Liked"),
        ("pass", "Pass"),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="picks",
    )
    tmdb_id = models.IntegerField()
    title = models.CharField(max_length=255)
    poster_path = models.URLField(max_length=500, null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    choice = models.CharField(max_length=10, choices=CHOICES, null=True, blank=True)
    is_saved = models.BooleanField(default=False)
    watched = models.BooleanField(default=False)
    picked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "tmdb_id"]
        ordering = ["-picked_at"]

    def __str__(self):
        return f"{self.user.username}: {self.title} ({self.choice})"
