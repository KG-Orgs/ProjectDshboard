from takeoff.api.main import app
for route in sorted(app.routes, key=lambda r: r.path):
    methods = getattr(route, 'methods', None)
    print(route.path, methods)
