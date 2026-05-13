from django.http import JsonResponse
from .models import Log
from authe.services.security import admin_required


@admin_required
def get_logs(request):
    logs = Log.objects.all().values('what', 'who', 'info', 'when')
    result = [
        {
            'what': l['what'],
            'who':  l['who'],
            'info': l['info'],
            'when': l['when'].isoformat(),
        }
        for l in logs
    ]
    return JsonResponse({'success': True, 'logs': result})
