from django.db import models


class Log(models.Model):
    what = models.CharField(max_length=50)
    who  = models.CharField(max_length=150)
    info = models.TextField()
    when = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-when']

    def __str__(self):
        return f"[{self.when:%Y-%m-%d %H:%M}] {self.what} — {self.info}"
