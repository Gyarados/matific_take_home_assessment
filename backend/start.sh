#!/bin/bash
gunicorn testapp.wsgi -b 0.0.0.0:8000
