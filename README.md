Prédicteur de Budget
Une application web Django permettant de prédire les budgets communaux (recettes et dépenses) à l’aide du machine learning.

Structure du Projet
data/mon_dataset.csv : Jeu de données exemple avec les données budgétaires historiques.

ml/train_model.py : Script pour entraîner et sauvegarder les modèles RandomForest par commune.

ml/model/ : Répertoire contenant les modèles entraînés.

predictor/ : Application Django avec les fichiers models.py, views.py et urls.py.

templates/predictor/form.html : Template frontend pour la saisie utilisateur et l'affichage des résultats.

static/css/style.css : Feuille de style de base.

static/js/predict.js : Fichier JavaScript gérant l’AJAX et la visualisation avec Chart.js.

Installation
Installer les dépendances :

bash
Copier
Modifier
pip install -r requirements.txt
Entraîner les modèles :

bash
Copier
Modifier
python ml/train_model.py
Configurer Django :

bash
Copier
Modifier
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
Accéder à l’application :
http://localhost:8000

Utilisation
Sélectionner une commune et entrer une année future (2024 à 2050).

Cliquer sur "Prédire" pour obtenir les prévisions de recettes et de dépenses.

Les résultats sont affichés sous forme de graphique en barres.



Notes
Les modèles sont entraînés par commune en utilisant RandomForestRegressor.

Une gestion des erreurs est intégrée pour garantir la validité des entrées.

Chart.js est utilisé pour la visualisation des résultats.

