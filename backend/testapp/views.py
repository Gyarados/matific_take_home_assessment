from django.http import HttpResponse


def hello_world(request):
    return HttpResponse('Hello World 3', status=200)


def health_check(request):
    return HttpResponse('OK', status=200)
