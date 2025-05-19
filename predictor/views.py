from django.shortcuts import render
from django.http import JsonResponse
from django.contrib import messages
import joblib
import os
from .models import Commune
import pandas as pd

def load_models_and_communes():
    models = {}
    model_dir = 'ml/model'
    for filename in os.listdir(model_dir):
        if filename.endswith('.joblib'):
            commune = filename.replace('model_', '').replace('.joblib', '')
            models[commune] = joblib.load(os.path.join(model_dir, filename))
    data = pd.read_excel('data/donnees_communes.xlsx')
    communes = data['Commune'].unique()
    for commune in communes:
        Commune.objects.get_or_create(name=commune)
    return models

MODELS = {}

def initialize_models():
    global MODELS
    MODELS = load_models_and_communes()

def predict(request):
    import logging
    logger = logging.getLogger(__name__)
    if request.method == 'POST':
        commune = request.POST.get('commune')
        start_annee = request.POST.get('start_annee')
        end_annee = request.POST.get('end_annee')
        logger.info(f"Received predict request with commune={commune}, start_annee={start_annee}, end_annee={end_annee}")
        try:
            start_annee = int(start_annee)
            end_annee = int(end_annee)
            if start_annee < 2024 or end_annee > 2050 or start_annee > end_annee:
                logger.warning(f"Invalid year range: {start_annee} - {end_annee}")
                return JsonResponse({'error': 'La plage d\'années doit être entre 2024 et 2050, et début <= fin'}, status=400)
            if commune not in MODELS:
                logger.warning(f"Unsupported commune: {commune}")
                return JsonResponse({'error': 'Commune non supportée'}, status=400)
            model = MODELS[commune]
            years = list(range(start_annee, end_annee + 1))
            recettes = []
            depenses = []
            for year in years:
                prediction = model.predict([[year]])
                recettes.append(round(float(prediction[0][0]), 2))
                depenses.append(round(float(prediction[0][1]), 2))
            logger.info(f"Prediction results for years {years}")
            return JsonResponse({
                'years': years,
                'recettes': recettes,
                'depenses': depenses
            })
        except ValueError:
            logger.warning(f"Invalid year values: start_annee={start_annee}, end_annee={end_annee}")
            return JsonResponse({'error': 'Année invalide'}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

def index(request):
    communes = Commune.objects.all()
    return render(request, 'predictor/form.html', {'communes': communes})

def home(request):
    return render(request, 'predictor/home.html')
