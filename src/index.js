import css from './styles.css';

const QRCode = require('qrcode');
import { PDFDocument, StandardFonts } from 'pdf-lib';

(function () {
    var step,
        storageName = 'attestation',
        fieldsData = window.localStorage.getItem(storageName),
        fields = {
            firstname: 'text',
            lastname: 'text',
            date: 'date',
            place: 'text',
            address: 'text',
            zipcode: 'number',
            city: 'text'
        },
        labels = {
            firstname: 'Prénom',
            lastname: 'Nom',
            date: 'Date de naissance',
            place: 'Lieu de naissance',
            address: 'Adresse',
            zipcode: 'Code postal',
            city: 'Ville',
            dateSortie: 'Date de sortie',
            heureSortie: 'Heure de sortie',
            created: 'Date de création:',
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
            courses: 'Déplacements pour effectuer des achats de fournitures nécessaires à l’activité professionnelle et des achats de première nécessité3 dans des établissements dont les activités demeurent autorisées (<a href="https://www.service-public.fr/particuliers/actualites/A13921" target="_blank">liste sur gouvernement.fr</a>).',
            sante: 'Consultations et soins ne pouvant être assurés à distance et ne pouvant être différés ; consultations et soins des patients atteints d\'une affection de longue durée.',
            famille: 'Déplacements pour motif familial impérieux, pour l’assistance aux personnes vulnérables ou la garde d’enfants.',
            sport: 'Déplacements brefs, dans la limite d\'une heure quotidienne et dans un rayon maximal d\'un kilomètre autour du domicile, liés soit à l\'activité physique individuelle des personnes, à l\'exclusion de toute pratique sportive collective et de toute proximité avec d\'autres personnes, soit à la promenade avec les seules personnes regroupées dans un même domicile, soit aux besoins des animaux de compagnie.',
            judiciaire: 'Convocation judiciaire ou administrative.',
            missions: 'Participation à des missions d’intérêt général sur demande de l’autorité administrative.'
        },
        pdfPosition = {
            name: [123, 686, 11],
            date: [123, 661, 11],
            place: [92, 638, 11],
            fullAddress: [134, 613, 11],
            reasons: {
                travail: [76, 527, 19],
                courses: [76, 478, 19],
                sante: [76, 436, 19],
                famille: [76, 400, 19],
                sport: [76, 345, 19],
                judiciaire: [76, 298, 19],
                missions: [76, 260, 19],
            },
            city: [111, 226, 11],
            dateSortie: [92, 200, 11],
            heureSortie: [200, 201, 11],
            minSortie: [220, 201, 11],
            createdLbl: [464, 150, 7],
            created: [455, 144, 7],
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
                    } else if (type == 'time') {
                        value =(value.getHours()+'').padStart(2, '0')+':'+(value.getMinutes()+'').padStart(2, '0');
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
            fieldsData.dateSortie = new Date();
            fieldsData.heureSortie = new Date();

            setStep('reasons');
            if (!reasonForm) {
                reasonForm = document.createElement('form');
                reasonForm.action = '#';
                reasonForm.method = 'post';

                addField(reasonForm, 'dateSortie', 'date', labels['dateSortie'], fieldsData['dateSortie']);
                addField(reasonForm, 'heureSortie', 'time', labels['heureSortie'], fieldsData['heureSortie']);

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
                    lbl.innerHTML = reasons[name];
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
            } else {
                // Update date and heure sortie
            }

            reasonForm.classList.remove('hide');
        },
        formatDate = function(date, simple, timeLetter = 'a') {
            var tmp = (date.getDate()+'').padStart(2, '0')+'/'+(1+date.getMonth()+'').padStart(2, '0')+'/'+date.getFullYear();
            if (!simple) {
                tmp+= ' '+timeLetter+' '+(date.getHours()+'').padStart(2, '0')+'h'+(date.getMinutes()+'').padStart(2, '0');
            }
            return tmp;
        },
        prepareData = function() {
            const data = [];

            fieldsData['date'] = new Date(fieldsData['date']);
            fieldsData['dateSortie'] = new Date(fieldsData['dateSortie']+'T'+fieldsData['heureSortie']);

            data.push(labelsQr['curDate']+': '+formatDate(fieldsData['now']));

            data.push(labelsQr['lastname']+': '+fieldsData['lastname']);
            data.push(labelsQr['firstname']+': '+fieldsData['firstname']);
            data.push(labelsQr['date']+': '+formatDate(fieldsData['date'], true)+' '+labelsQr['place']+' '+fieldsData['place']);
            data.push(labelsQr['address']+': '+fieldsData['address']+' '+fieldsData['zipcode']+' '+fieldsData['city']);

            data.push(labelsQr['dateSortie']+': '+formatDate(fieldsData['dateSortie']));

            data.push(labelsQr['reasons']+': '+fieldsData['reasons'].join('-'));

            return data;
        },
        download = function(file) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(file);
            a.download = 'attestation.pdf';
            document.body.appendChild(a);
            a.click();

            return a;
        },
        qrDiv,
        detectCitySize = function(font, text, maxWidth, minSize, startSize) {
            for (var o = startSize, c = font.widthOfTextAtSize(text, startSize); c > maxWidth && o > minSize; ) {
                c = font.widthOfTextAtSize(text, --o);
            }
            return c > maxWidth ? null : o;
        },
        drawText = function(pdfDoc, font, text, prms) {
            return pdfDoc.drawText(text, {
                x: prms[0],
                y: prms[1],
                size: prms[2],
                font: font
            });
        },
        showQr = function () {
            setStep('qr');

            fieldsData['now'] = new Date();

            const data = prepareData();

            fetch(document.body.dataset.pdf).then(function(response) {
                return response.arrayBuffer();
            }).then(function(pdfBuff) {
                return PDFDocument.load(pdfBuff);
            }).then(function(pdfDoc) {
                return Promise.all([
                    pdfDoc,
                    pdfDoc.embedFont(StandardFonts.Helvetica),
                    QRCode.toDataURL(data.join('; '), {
                        errorCorrectionLevel: 'M',
                        type: "image/png",
                        quality: .92,
                        margin: 1
                    })
                ]);
                
            }).then(function(vals) {
                const pdfDoc = vals[0];
                const page = pdfDoc.getPages()[0];
                const font = vals[1];
                const qrCode = vals[2];

                const minSize = 7;
                let citySize = detectCitySize(font, fieldsData.city, 83, minSize, 11);
                if (!citySize) {
                    alert('Le nom de la ville risque de ne pas être affiché correctement en raison de sa longueur. Essayez d\'utiliser des abréviations ("Saint" en "St." par exemple) quand cela est possible.')
                    citySize = minSize;
                }

                drawText(page, font, fieldsData['firstname']+' '+fieldsData['lastname'], pdfPosition.name);
                drawText(page, font, formatDate(fieldsData['date'], true), pdfPosition.date);
                drawText(page, font, fieldsData['place'], pdfPosition.place);
                drawText(page, font, fieldsData['address']+' '+fieldsData['zipcode']+' '+fieldsData['city'], pdfPosition.fullAddress);

                fieldsData.reasons.forEach(function(reason) {
                    drawText(page, font, 'x', pdfPosition.reasons[reason]);
                });

                drawText(page, font, fieldsData['city'], pdfPosition.city);
                drawText(page, font, formatDate(fieldsData['dateSortie'], true), pdfPosition.dateSortie);
                drawText(page, font, (fieldsData['dateSortie'].getHours()+'').padStart(2, '0'), pdfPosition.heureSortie);
                drawText(page, font, (fieldsData['dateSortie'].getMinutes()+'').padStart(2, '0'), pdfPosition.minSortie);
                drawText(page, font, labels['created'], pdfPosition.createdLbl);
                drawText(page, font, formatDate(fieldsData['now'], false, 'à'), pdfPosition.created);

                return Promise.all([
                    pdfDoc,
                    qrCode,
                    pdfDoc.embedPng(qrCode)
                ]);
            }).then(function(vals) {
                const pdfDoc = vals[0];
                const qrCode = vals[1];
                const emebedded = vals[2];

                let page = pdfDoc.getPages()[0];

                page.drawImage(emebedded, {
                    x: page.getWidth() - 170,
                    y: 155,
                    width: 100,
                    height: 100
                });

                pdfDoc.addPage();

                page = pdfDoc.getPages()[1];

                page.drawImage(emebedded, {
                    x: 50,
                    y: page.getHeight() - 350,
                    width: 300,
                    height: 300
                });

                return Promise.all([
                    pdfDoc,
                    qrCode,
                    pdfDoc.save()
                ]);
            }).then(function(vals) {
                const pdfDoc = vals[0];
                const qrCode = vals[1];
                const pdfBytes = vals[2];

                const pdfBlob = new Blob([pdfBytes], {
                    type: 'application/pdf'
                });

                download(pdfBlob, 'attestation.pdf');                

                qrDiv = document.createElement('div');
                qrDiv.classList.add('qr');

                var img = document.createElement('img');
                img.alt = 'QR Code';
                img.src = qrCode;
                qrDiv.appendChild(img);

                var p = document.createElement('p');
                p.innerHTML = data.join('<br />');
                qrDiv.appendChild(p);

                document.body.appendChild(qrDiv);
            });
        };

    document.getElementById('back').addEventListener('click', function(e) {
        e.preventDefault();

        switch(step) {
            case 'qr':
                if (qrDiv) {
                    qrDiv.parentNode.removeChild(qrDiv);
                }
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
        fieldsData = {};
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