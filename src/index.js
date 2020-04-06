import css from './styles.css';

import './qrjs2.js';

(function () {
    var step,
        storageName = 'attestation',
        fieldsData = window.localStorage.getItem(storageName),
        fields = {
            lastname: 'text',
            firstname: 'text',
            date: 'date',
            place: 'text',
            address: 'text',
            zipcode: 'number',
            city: 'text'
        },
        labels = {
            lastname: 'Nom',
            firstname: 'Prénom',
            date: 'Date de naissance',
            place: 'Lieu de naissance',
            address: 'Adresse',
            zipcode: 'Code postal',
            city: 'Ville',
            dateSortie: 'Date de sortie',
        },
        labelsQr = {
            curDate: 'Cree le',
            lastname: 'Nom',
            firstname: 'Prenom',
            date: 'Naissance',
            place: 'a',
            address: 'Adresse',
            dateSortie: 'Sortie',
            reasons: 'Motifs',
        },
        reasons = {
            travail: 'Déplacements entre le domicile et le lieu d’exercice de l’activité professionnelle, lorsqu’ils sont indispensables à l’exercice d’activités ne pouvant être organisées sous forme de télétravail ou déplacements professionnels ne pouvant être différés',
            proAchat: 'Déplacements pour effectuer des achats de fournitures nécessaires à l’activité professionnelle et des achats de première nécessité3 dans des établissements dont les activités demeurent autorisées (liste sur gouvernement.fr).',
            medical: 'Consultations et soins ne pouvant être assurés à distance et ne pouvant être différés ; consultations et soins des patients atteints d\'une affection de longue durée.',
            famille: 'Déplacements pour motif familial impérieux, pour l’assistance aux personnes vulnérables ou la garde d’enfants.',
            sport: 'Déplacements brefs, dans la limite d\'une heure quotidienne et dans un rayon maximal d\'un kilomètre autour du domicile, liés soit à l\'activité physique individuelle des personnes, à l\'exclusion de toute pratique sportive collective et de toute proximité avec d\'autres personnes, soit à la promenade avec les seules personnes regroupées dans un même domicile, soit aux besoins des animaux de compagnie.',
            judiciaire: 'Convocation judiciaire ou administrative.',
            general: 'Participation à des missions d’intérêt général sur demande de l’autorité administrative.'
        },
        setStep = function(newStep) {
            document.body.removeAttribute('class');
            document.body.classList.add(newStep);
            step = newStep;
        },
        formatDateField = function(date, simple) {
            var tmp = date.getFullYear()+'-'+(1+date.getMonth()+'').padStart(2, '0')+'-'+(date.getDate()+'').padStart(2, '0');
            if (!simple) {
                tmp+= 'T'+(date.getHours()+'').padStart(2, '0')+':'+(date.getMinutes()+'').padStart(2, '0');
            }
            return tmp;
        },
        addField = function(form, name, type, label, value) {
            var div = document.createElement('div');
            div.classList.add('form_row');

            var lbl = document.createElement('label');
            lbl.setAttribute('for', name);
            lbl.innerText = label;
            div.appendChild(lbl);

            var input = document.createElement('input');
            input.name = name;
            input.type = type;
            input.id = name;
            input.required = true;
            input.innerText = input;

            if (type == 'number') {
                input.maxlength = 5;
            }

            if (value) {
                if (value instanceof Date) {
                    if (type == 'date') {
                        value = formatDateField(value, true);
                    } else if (type == 'datetime') {
                        value = formatDateField(value);
                    }
                }
                input.value = value;
            }

            div.appendChild(input);

            form.appendChild(div);
        },
        fieldsForm,
        showFieldsForm = function() {
            setStep('fields');
            if (!fieldsForm) {
                fieldsForm = document.createElement('form');
                fieldsForm.action = '#';
                fieldsForm.method = 'post';

                Object.keys(fields).forEach(function(name) {
                    addField(fieldsForm, name, fields[name], labels[name], fieldsData[name]);
                });

                var button = document.createElement('button');
                button.type = 'submit';
                button.innerText = 'Enregistrer';
                fieldsForm.appendChild(button);

                document.body.appendChild(fieldsForm);

                fieldsForm.addEventListener('submit', function(e) {
                    e.preventDefault();

                    var formData = new FormData(fieldsForm);

                    fieldsData = {};
                    for(var pair of formData.entries()) {
                        fieldsData[pair[0]] = pair[1];
                    }

                    window.localStorage.setItem(storageName, JSON.stringify(fieldsData));
                    fieldsForm.classList.add('hide');
                    showReasons();
                });
            }

            fieldsForm.classList.remove('hide');
        },
        reasonForm,
        showReasons = function() {
            setStep('reasons');
            if (!reasonForm) {
                reasonForm = document.createElement('form');
                reasonForm.action = '#';
                reasonForm.method = 'post';

                addField(reasonForm, 'dateSortie', 'datetime-local', labels['dateSortie'], fieldsData['dateSortie']);

                var div = document.createElement('div');
                div.classList.add('form_row');
    
                var lbl = document.createElement('label');
                lbl.innerText = 'Raisons';
                div.appendChild(lbl);
    
                var ul = document.createElement('ul');

                Object.keys(reasons).forEach(function(name) {
                    var li = document.createElement('li');

                    var input = document.createElement('input');
                    input.name = 'reasons';
                    input.type = 'checkbox';
                    input.value = name;
                    input.id = name;

                    if (fieldsData.reasons && fieldsData.reasons.indexOf(name) != -1) {
                        input.checked = true;
                    }

                    li.appendChild(input);

                    var lbl = document.createElement('label');
                    lbl.setAttribute('for', name);
                    lbl.innerText = reasons[name];
                    li.appendChild(lbl);

                    ul.appendChild(li);
                });

                div.appendChild(ul);

                reasonForm.appendChild(div);

                var button = document.createElement('button');
                button.type = 'submit';
                button.innerText = 'Générer';
                reasonForm.appendChild(button);

                document.body.appendChild(reasonForm);

                reasonForm.addEventListener('submit', function(e) {
                    e.preventDefault();

                    var formData = new FormData(reasonForm);

                    fieldsData['reasons'] = [];
                    for(var pair of formData.entries()) {
                        if (pair[0] == 'reasons') {
                            fieldsData[pair[0]].push(pair[1]);
                        } else {
                            fieldsData[pair[0]] = pair[1];
                        }
                    }

                    window.localStorage.setItem(storageName, JSON.stringify(fieldsData));
                    reasonForm.classList.add('hide');
                    showQr();
                });
            }

            reasonForm.classList.remove('hide');
        },
        formatDate = function(date, simple) {
            var tmp = (date.getDate()+'').padStart(2, '0')+'/'+(1+date.getMonth()+'').padStart(2, '0')+'/'+date.getFullYear();
            if (!simple) {
                tmp+= ' a '+(date.getHours()+'').padStart(2, '0')+'h'+(date.getMinutes()+'').padStart(2, '0');
            }
            return tmp;
        },
        prepareData = function() {
            const data = [];

            fieldsData['date'] = new Date(fieldsData['date']);
            fieldsData['dateSortie'] = new Date(fieldsData['dateSortie']);

            data.push(labelsQr['curDate']+': '+formatDate(fieldsData['now']));

            data.push(labelsQr['lastname']+': '+fieldsData['lastname']);
            data.push(labelsQr['firstname']+': '+fieldsData['firstname']);
            data.push(labelsQr['date']+': '+formatDate(fieldsData['date'], true)+' '+labelsQr['place']+' '+fieldsData['place']);
            data.push(labelsQr['address']+': '+fieldsData['address']+' '+fieldsData['zipcode']+' '+fieldsData['city']);

            data.push(labelsQr['dateSortie']+': '+formatDate(fieldsData['dateSortie']));

            data.push(labelsQr['reasons']+': '+fieldsData['reasons'].join(', '));

            return data.join('; ');
        },
        qrDiv,
        showQr = function () {
            setStep('qr');

            fieldsData['now'] = new Date();

            qrDiv = document.createElement('div');
            qrDiv.classList.add('qr');

            // Improve to have the exact same precision than regular
            var s = QRCode.generateSVG(prepareData(), {
                ecclevel: 'M', // L, M, Q, H
                fillcolor: '#FFFFFF',
                textcolor: '#373737',
                margin: 1,
                modulesize: 8
            });

            qrDiv.appendChild(s);
            
            document.body.appendChild(qrDiv);
        };

    document.getElementById('back').addEventListener('click', function(e) {
        e.preventDefault();

        switch(step) {
            case 'qr':
                qrDiv.parentNode.removeChild(qrDiv);
                showReasons();
                break;
            case 'reasons':
                reasonForm.classList.add('hide');
                showFieldsForm();
                break;
        }
    });

    if (fieldsData) {
        fieldsData = JSON.parse(fieldsData);
        showReasons();
    } else {
        fieldsData = {
            dateSortie: new Date(),
        };
        showFieldsForm();
    }

    if ('serviceWorker' in navigator && document.body.dataset.sw) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(document.body.dataset.sw).then((registration) => {
                if (!navigator.serviceWorker.controller) {
                    return;
                }

                navigator.serviceWorker.controller.addEventListener('message', (e) => {
                    console.warn(e.data);
                });
            }, (err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }

    // Prompt install
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        var deferredPrompt = e;

        const installButton = document.createElement('a');
        installButton.href = '#';
        installButton.className = 'installBut';
        installButton.innerText = 'Installer';

        installButton.addEventListener('click', function(e) {
            deferredPrompt.prompt();

            // Follow what the user has done with the prompt.
            deferredPrompt.userChoice.then(function (choiceResult) {
                console.log(choiceResult.outcome);

                if (choiceResult.outcome == 'dismissed') {
                    // @todo show him an alert here?
                    console.log('User cancelled home screen install');
                } else {
                    console.log('User added to home screen');
                }

                installButton.parentNode.removeChild(installButton);

                // We no longer need the prompt.  Clear it up.
                deferredPrompt = null;
            });
        });

        document.body.appendChild(installButton);
    });
})();