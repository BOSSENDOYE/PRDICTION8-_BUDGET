$(document).ready(function() {
    let chartInstance = null;

    $('#predict-form').submit(function(event) {
        event.preventDefault();
        const startYear = parseInt($('#start_annee').val());
        const endYear = parseInt($('#end_annee').val());
        if (isNaN(startYear) || isNaN(endYear) || startYear > endYear) {
            alert('Veuillez entrer une plage d\'années valide.');
            return;
        }

        const postData = {
            commune: $('#commune').val(),
            start_annee: startYear,
            end_annee: endYear,
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
        };
        console.log('Données envoyées:', postData);

        $.ajax({
            url: predictUrl,
            type: 'POST',
            data: postData,
            success: function(response) {
                if (response.error) {
                    alert(response.error);
                } else {
                    $('#result').show();
                    const ctx = document.getElementById('predictionChart').getContext('2d');
                    const labels = response.years;
                    const recettes = response.recettes;
                    const depenses = response.depenses;

                    let predictionHtml = '<h3>Valeurs prédites :</h3><ul>';
                    for (let i = 0; i < labels.length; i++) {
                        predictionHtml += `<li>Année ${labels[i]} : Recettes = ${recettes[i]} M€, Dépenses = ${depenses[i]} M€</li>`;
                    }
                    predictionHtml += '</ul>';
                    $('#predictionValues').html(predictionHtml);

                    if (chartInstance) {
                        chartInstance.destroy();
                    }

                    chartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    label: 'Recettes (M€)',
                                    data: recettes,
                                    borderColor: '#36A2EB',
                                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                    fill: true
                                },
                                {
                                    label: 'Dépenses (M€)',
                                    data: depenses,
                                    borderColor: '#FF6384',
                                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                    fill: true
                                }
                            ]
                        },
                        options: {
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                }
            },
            error: function() {
                alert('Erreur lors de la prédiction.');
            }
        });
    });
});
