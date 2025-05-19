// predict.js - Avec gestion complète des erreurs
$(document).ready(function() {
    // Référence aux éléments du formulaire
    const form = $('#predict-form');
    const communeSelect = $('#commune');
    const startYearInput = $('#start_annee');
    const endYearInput = $('#end_annee');
    const submitButton = $('button[type="submit"]');
    const resultDiv = $('#result');
    const predictionValuesDiv = $('#predictionValues');
    const MIN_YEAR = 2024;
    const MAX_YEAR = 2050;

    // Fonction pour créer un message d'alerte
    function createAlert(type, message) {
        // Supprimer les alertes existantes du même type
        $(`.alert-${type}`).remove();
        
        const alert = $(`<div class="alert alert-${type}"></div>`);
        alert.text(message);
        
        // Ajouter un bouton de fermeture
        const closeButton = $('<button class="alert-close">&times;</button>');
        closeButton.click(function() {
            alert.fadeOut(300, function() {
                $(this).remove();
            });
        });
        
        alert.append(closeButton);
        
        // Ajouter l'alerte avant le formulaire
        form.before(alert);
        
        // Auto-fermeture après 8 secondes pour les succès
        if (type === 'success') {
            setTimeout(function() {
                if (alert) {
                    alert.fadeOut(300, function() {
                        $(this).remove();
                    });
                }
            }, 8000);
        }
    }

    // Fonction pour afficher une erreur sous un champ
    function showFieldError(field, message) {
        // Supprimer les erreurs existantes
        field.next('.error-message').remove();
        
        // Ajouter la classe d'erreur
        field.addClass('error').addClass('shake');
        
        // Créer et ajouter le message d'erreur
        const errorMessage = $('<div class="error-message"></div>').text(message);
        field.after(errorMessage);
        errorMessage.fadeIn();
        
        // Supprimer la classe d'animation après l'animation
        setTimeout(function() {
            field.removeClass('shake');
        }, 500);
    }

    // Fonction pour effacer les erreurs d'un champ
    function clearFieldError(field) {
        field.removeClass('error');
        field.next('.error-message').fadeOut(300, function() {
            $(this).remove();
        });
    }

    // Validation des champs au changement
    startYearInput.on('input', function() {
        clearFieldError($(this));
    });

    endYearInput.on('input', function() {
        clearFieldError($(this));
    });

    communeSelect.on('change', function() {
        clearFieldError($(this));
    });

    // Validation du formulaire
    function validateForm() {
        let isValid = true;
        
        // Valider la commune
        if (!communeSelect.val()) {
            showFieldError(communeSelect, 'Veuillez sélectionner une commune');
            isValid = false;
        } else {
            clearFieldError(communeSelect);
        }
        
        // Valider l'année de début
        const startYear = parseInt(startYearInput.val());
        if (!startYearInput.val() || isNaN(startYear) || startYear < MIN_YEAR || startYear > MAX_YEAR) {
            showFieldError(startYearInput, `L'année doit être comprise entre ${MIN_YEAR} et ${MAX_YEAR}`);
            isValid = false;
        } else {
            clearFieldError(startYearInput);
        }
        
        // Valider l'année de fin
        const endYear = parseInt(endYearInput.val());
        if (!endYearInput.val() || isNaN(endYear) || endYear < MIN_YEAR || endYear > MAX_YEAR) {
            showFieldError(endYearInput, `L'année doit être comprise entre ${MIN_YEAR} et ${MAX_YEAR}`);
            isValid = false;
        } else {
            clearFieldError(endYearInput);
        }
        
        // Valider que l'année de fin est supérieure à l'année de début
        if (isValid && endYear <= startYear) {
            showFieldError(endYearInput, "L'année de fin doit être supérieure à l'année de début");
            isValid = false;
        }
        
        return isValid;
    }

    // Gérer la soumission du formulaire
    form.on('submit', function(e) {
        e.preventDefault();
        
        // Valider le formulaire
        if (!validateForm()) {
            return false;
        }
        
        // Afficher l'état de chargement
        submitButton.prop('disabled', true);
        submitButton.html('<span class="spinner"></span><span class="loading-text">Calcul en cours...</span>');
        
        // Préparer les données
        const data = {
            commune: communeSelect.val(),
            start_annee: startYearInput.val(),
            end_annee: endYearInput.val()
        };
        
        // Envoyer la requête AJAX
        $.ajax({
            url: predictUrl,
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]').val()
            },
            success: function(response) {
                // Réactiver le bouton
                submitButton.prop('disabled', false);
                submitButton.html('Prédire');
                
                // Afficher le succès
                createAlert('success', `Prédiction générée avec succès pour ${communeSelect.find('option:selected').text()}`);
                
                // Afficher les résultats
                displayResults(response);
            },
            error: function(xhr) {
                // Réactiver le bouton
                submitButton.prop('disabled', false);
                submitButton.html('Prédire');
                
                // Gérer différents types d'erreurs
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    
                    if (errorData.error_code) {
                        switch (errorData.error_code) {
                            case 'E001':
                                // Commune non trouvée
                                showFieldError(communeSelect, errorData.message);
                                break;
                            case 'E002':
                                // Année invalide
                                if (errorData.field === 'start_annee') {
                                    showFieldError(startYearInput, errorData.message);
                                } else {
                                    showFieldError(endYearInput, errorData.message);
                                }
                                break;
                            case 'E003':
                                // Erreur de modèle ML
                                createAlert('error', `Erreur du modèle : ${errorData.message}`);
                                break;
                            case 'E004':
                                // Données insuffisantes
                                createAlert('warning', errorData.message);
                                break;
                            default:
                                // Autre erreur connue
                                createAlert('error', errorData.message || 'Une erreur est survenue');
                        }
                    } else {
                        // Erreur générique
                        createAlert('error', 'Une erreur inattendue est survenue lors du traitement de votre demande');
                    }
                } catch (e) {
                    // Erreur de parsing
                    if (xhr.status === 0) {
                        createAlert('error', 'Impossible de communiquer avec le serveur. Vérifiez votre connexion internet.');
                    } else if (xhr.status === 500) {
                        createAlert('error', 'Erreur interne du serveur. Veuillez réessayer plus tard.');
                    } else {
                        createAlert('error', `Erreur (${xhr.status}): Veuillez réessayer plus tard.`);
                    }
                }
            }
        });
    });

    // Fonction pour afficher les résultats
    function displayResults(data) {
        // Vérifier si des avertissements doivent être affichés
        if (data.warnings && data.warnings.length > 0) {
            data.warnings.forEach(warning => {
                createAlert('warning', warning);
            });
        }
        
        // Construire le contenu HTML pour les valeurs de prédiction
        let valuesHTML = '<table class="prediction-table">';
        valuesHTML += '<tr><th>Année</th><th>Recettes (M€)</th><th>Dépenses (M€)</th></tr>';
        
        // Années et prédictions
        const years = [];
        const recettes = [];
        const depenses = [];
        
        Object.keys(data.predictions).sort().forEach(year => {
            const pred = data.predictions[year];
            years.push(year);
            recettes.push(pred.recettes);
            depenses.push(pred.depenses);
            
            valuesHTML += `<tr>
                <td>${year}</td>
                <td>${pred.recettes.toFixed(2)}</td>
                <td>${pred.depenses.toFixed(2)}</td>
            </tr>`;
        });
        
        valuesHTML += '</table>';
        
        // Afficher les valeurs
        predictionValuesDiv.html(valuesHTML);
        
        // Afficher le graphique
        const ctx = document.getElementById('predictionChart').getContext('2d');
        
        // Détruire le graphique existant s'il y en a un
        if (window.predChart) {
            window.predChart.destroy();
        }
        
        // Créer un nouveau graphique
        window.predChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Recettes (M€)',
                        data: recettes,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        tension: 0.3
                    },
                    {
                        label: 'Dépenses (M€)',
                        data: depenses,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#f8fafc'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#f8fafc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#f8fafc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
        
        // Afficher le conteneur de résultats
        resultDiv.fadeIn();
    }
});