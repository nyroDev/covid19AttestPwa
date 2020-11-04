import css from './styles.css';

const QRCode = require('qrcode');
import removeAccents from 'remove-accents';
import { PDFDocument, StandardFonts } from 'pdf-lib';

(function () {
    const storageName = 'attestation';
    const cacheAttestName = 'attestPdf';
    const cachePdfName = 'attestation.pdf';

    let step,
        fieldsData = window.localStorage.getItem(storageName),
        fieldsForm,
        reasonForm,
        qrDiv;

    const
        fields = {
            firstname: {
                type: 'text',
                autocomplete: 'given-name',
                placeholder: 'Jean',
            },
            lastname: {
                type: 'text',
                autocomplete: 'family-name',
                placeholder: 'Dupont',
            },
            date: {
                type: 'text',
                inputmode: 'numeric',
                autocomplete: 'bday',
                placeholder: '01/01/1970',
                maxlength: 10,
                pattern: '[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}'
            },
            place: {
                type: 'text',
                placeholder: 'Lyon',
            },
            address: {
                type: 'text',
                autocomplete: 'address-line1',
                placeholder: '999 avenue de france',
            },
            zipcode: {
                type: 'number',
                min: '00000',
                max: '999999',
                minlength: 4,
                maxlength: 5,
                autocomplete: 'zipcode',
                placeholder: '75001',
            },
            city: {
                type: 'text',
                autocomplete: 'address-level1',
                placeholder: 'Paris',
            }
        },
        fieldsDate = {
            date: {
                type: 'date',
                placeholder: 'JJ/MM/AAAA',
                pattern: '[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}'
            },
            time: {
                type: 'time',
            }
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
            travail: 'Déplacements entre le domicile et le lieu d\'exercice de l\'activité professionnelle ou les déplacements professionnels ne pouvant être différés',
            achats: 'Déplacements pour effectuer des achats de fournitures nécessaires à l\'activité professionnelle, des achats de première nécessité dans des établissements dont les activités demeurent autorisées et les livraisons à domicile',
            sante: 'Consultations et soins ne pouvant être assurés à distance et ne pouvant être différés et l’achat de médicaments',
            famille: 'Déplacements pour motif familial impérieux, pour l\'assistance aux personnes vulnérables et précaires ou la garde d\'enfants',
            handicap: 'Déplacements des personnes en situation de handicap et de leur accompagnant',
            sport_animaux: 'Déplacements brefs, dans la limite d\'une heure quotidienne et dans un rayon maximal d\'un kilomètre autour du domicile, liés soit à l\'activité physique individuelle des personnes, à l\'exclusion de toute pratique sportive collective et de toute proximité avec d\'autres personnes, soit à la promenade avec les seules personnes regroupées dans un même domicile, soit aux besoins des animaux de compagnie',
            convocation: 'Convocation judiciaire ou administrative et rendez-vous dans un service public',
            missions: 'Participation à des missions d\'intérêt général sur demande de l\'autorité administrative',
            enfants: 'Déplacement pour chercher les enfants à l’écoles et à l’occasion de leurs activités périscolaires',
        },
        pdfPosition = {
            name: [119, 696, 11],
            date: [119, 674, 11],
            place: [297, 674, 11],
            fullAddress: [133, 652, 11],
            reasons: {
                travail: [78, 578, 18],
                achats: [78, 533, 18],
                sante: [78, 477, 18],
                famille: [78, 435, 18],
                handicap: [78, 396, 18],
                sport_animaux: [78, 358, 18],
                convocation: [78, 295, 18],
                missions: [78, 255, 18],
                enfants: [78, 211, 18],
            },
            city: [105, 177, 11],
            dateSortie: [91, 153, 11],
            heureSortie: [264, 153, 11],
        },
        toAscii = function(string) {
            if (typeof string !== 'string') {
                throw new Error('Need string')
            }
            return removeAccents(string).replace(/[^\x00-\x7F]/g, '');
        },
        setStep = function (newStep) {
            document.body.removeAttribute('class');
            document.body.classList.add(newStep);
            step = newStep;
        },
        formatDateField = function (date, simple) {
            let tmp = date.getFullYear() + '-' + (1 + date.getMonth() + '').padStart(2, '0') + '-' + (date.getDate() + '').padStart(2, '0');
            if (!simple) {
                tmp += 'T' + (date.getHours() + '').padStart(2, '0') + ':' + (date.getMinutes() + '').padStart(2, '0');
            }
            return tmp;
        },
        addField = function (form, name, config, label, value) {
            const div = document.createElement('div');
            div.classList.add('form_row');

            const lbl = document.createElement('label');
            lbl.setAttribute('for', name);
            lbl.innerText = label;
            div.appendChild(lbl);

            const input = document.createElement('input');
            input.name = name;
            input.id = name;
            input.required = true;

            Object.keys(config).forEach(function (cfg) {
                input.setAttribute(cfg, config[cfg]);
            });

            if (value) {
                if (value instanceof Date) {
                    if (config.type == 'date') {
                        value = formatDateField(value, true);
                    } else if (config.type == 'time') {
                        value = (value.getHours() + '').padStart(2, '0') + ':' + (value.getMinutes() + '').padStart(2, '0');
                    }
                }
                input.value = value;
            }

            div.appendChild(input);

            form.appendChild(div);

            return input;
        },
        showFieldsForm = function () {
            setStep('fields');
            if (!fieldsForm) {
                fieldsForm = document.createElement('form');
                fieldsForm.action = '#';
                fieldsForm.method = 'post';

                Object.keys(fields).forEach(function (name) {
                    const input = addField(fieldsForm, name, fields[name], labels[name], fieldsData[name]);
                    if (name === 'date') {
                        input.addEventListener('keyup', function () {
                            this.value = this.value.replace(/^(\d{2})$/g, "$1/").replace(/^(\d{2})\/(\d{2})$/g, "$1/$2/");
                        });
                    }
                });

                const button = document.createElement('button');
                button.type = 'submit';
                button.innerText = 'Enregistrer';
                fieldsForm.appendChild(button);

                document.body.appendChild(fieldsForm);

                fieldsForm.addEventListener('submit', function (e) {
                    e.preventDefault();

                    const formData = new FormData(fieldsForm);

                    fieldsData = {};
                    for (let pair of formData.entries()) {
                        fieldsData[pair[0]] = pair[1];
                    }

                    window.localStorage.setItem(storageName, JSON.stringify(fieldsData));

                    fieldsForm.classList.add('hide');
                    showReasons();
                });
            }

            fieldsForm.classList.remove('hide');
        },
        showReasons = function () {
            fieldsData.dateSortie = new Date();
            fieldsData.heureSortie = new Date();

            setStep('reasons');
            if (!reasonForm) {
                reasonForm = document.createElement('form');
                reasonForm.action = '#';
                reasonForm.method = 'post';

                addField(reasonForm, 'dateSortie', fieldsDate['date'], labels['dateSortie'], fieldsData['dateSortie']);
                addField(reasonForm, 'heureSortie', fieldsDate['time'], labels['heureSortie'], fieldsData['heureSortie']);

                const div = document.createElement('div');
                div.classList.add('form_row');

                const lbl = document.createElement('label');
                lbl.innerText = 'Raisons';
                div.appendChild(lbl);

                const ul = document.createElement('ul');

                Object.keys(reasons).forEach(function (name) {
                    const li = document.createElement('li');

                    const input = document.createElement('input');
                    input.name = 'reasons';
                    input.type = 'checkbox';
                    input.value = name;
                    input.id = name;

                    if (fieldsData.reasons && fieldsData.reasons.indexOf(name) != -1) {
                        input.checked = true;
                    }

                    li.appendChild(input);

                    const lbl = document.createElement('label');
                    lbl.setAttribute('for', name);
                    lbl.innerHTML = reasons[name];
                    li.appendChild(lbl);

                    ul.appendChild(li);
                });

                div.appendChild(ul);

                reasonForm.appendChild(div);

                const button = document.createElement('button');
                button.type = 'submit';
                button.innerText = 'Générer';
                reasonForm.appendChild(button);

                document.body.appendChild(reasonForm);

                reasonForm.addEventListener('submit', function (e) {
                    e.preventDefault();

                    const formData = new FormData(reasonForm);

                    fieldsData['reasons'] = [];
                    for (let pair of formData.entries()) {
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
        formatDate = function (date, simple, timeLetter = 'a', sepHour = 'h') {
            let tmp = (date.getDate() + '').padStart(2, '0') + '/' + (1 + date.getMonth() + '').padStart(2, '0') + '/' + date.getFullYear();
            if (!simple) {
                tmp += ' ' + timeLetter + ' ' + (date.getHours() + '').padStart(2, '0') + sepHour + (date.getMinutes() + '').padStart(2, '0');
            }
            return tmp;
        },
        prepareData = function () {
            const data = [];

            fieldsData['dateSortie'] = new Date(fieldsData['dateSortie'] + 'T' + fieldsData['heureSortie']);

            data.push(toAscii(labelsQr['curDate'] + ': ' + formatDate(fieldsData['now'])));

            data.push(toAscii(labelsQr['lastname'] + ': ' + fieldsData['lastname']));
            data.push(toAscii(labelsQr['firstname'] + ': ' + fieldsData['firstname']));
            data.push(toAscii(labelsQr['date'] + ': ' + fieldsData['date'] + ' ' + labelsQr['place'] + ' ' + fieldsData['place']));
            data.push(toAscii(labelsQr['address'] + ': ' + fieldsData['address'] + ' ' + fieldsData['zipcode'] + ' ' + fieldsData['city']));

            data.push(labelsQr['dateSortie'] + ': ' + formatDate(fieldsData['dateSortie'], false, 'a', ':'));

            data.push(labelsQr['reasons'] + ': ' + fieldsData['reasons'].join(', '));

            data.push('');

            return data;
        },
        downloadBlob = function (file) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(file);
            a.download = 'attestation_' + (formatDate(fieldsData['dateSortie']).replace(/ /g, '-')) + '.pdf';
            document.body.appendChild(a);
            a.click();

            return a;
        },
        downloadSw = function (file) {
            const a = document.createElement('a');
            a.href = file;
            document.body.appendChild(a);
            a.click();

            return a;
        },
        detectCitySize = function (font, text, maxWidth, minSize, startSize) {
            let o, c;
            for (o = startSize, c = font.widthOfTextAtSize(text, startSize); c > maxWidth && o > minSize;) {
                c = font.widthOfTextAtSize(text, --o);
            }
            return c > maxWidth ? null : o;
        },
        drawText = function (pdfDoc, font, text, prms, forceSize) {
            return pdfDoc.drawText(text, {
                x: prms[0],
                y: prms[1],
                size: forceSize ? forceSize : prms[2],
                font: font
            });
        },
        showQr = function () {
            setStep('qr');

            fieldsData['now'] = new Date();

            const data = prepareData();

            fetch(document.body.dataset.pdf).then(function (response) {
                return response.arrayBuffer();
            }).then(function (pdfBuff) {
                return PDFDocument.load(pdfBuff);
            }).then(function (pdfDoc) {
                pdfDoc.setTitle("COVID-19 - Déclaration de déplacement");
                pdfDoc.setSubject("Attestation de déplacement dérogatoire");
                pdfDoc.setKeywords(["covid19", "covid-19", "attestation", "déclaration", "déplacement", "officielle", "gouvernement"]);
                pdfDoc.setProducer("DNUM/SDIT");
                pdfDoc.setCreator("");
                pdfDoc.setAuthor("Ministère de l'intérieur");

                return Promise.all([
                    pdfDoc,
                    pdfDoc.embedFont(StandardFonts.Helvetica),
                    QRCode.toDataURL(data.join(";\n"), {
                        errorCorrectionLevel: 'M',
                        type: 'image/png',
                        quality: .92,
                        margin: 1
                    })
                ]);

            }).then(function (vals) {
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

                drawText(page, font, toAscii(fieldsData['firstname'] + ' ' + fieldsData['lastname']), pdfPosition.name);
                drawText(page, font, toAscii(fieldsData['date']), pdfPosition.date);
                drawText(page, font, toAscii(fieldsData['place']), pdfPosition.place);
                drawText(page, font, toAscii(fieldsData['address'] + ' ' + fieldsData['zipcode'] + ' ' + fieldsData['city']), pdfPosition.fullAddress);

                fieldsData.reasons.forEach(function (reason) {
                    drawText(page, font, 'x', pdfPosition.reasons[reason]);
                });

                drawText(page, font, toAscii(fieldsData['city']), pdfPosition.city, citySize);
                drawText(page, font, formatDate(fieldsData['dateSortie'], true), pdfPosition.dateSortie);
                drawText(page, font, (fieldsData['dateSortie'].getHours() + '').padStart(2, '0')+':'+(fieldsData['dateSortie'].getMinutes() + '').padStart(2, '0'), pdfPosition.heureSortie);
                
                return Promise.all([
                    pdfDoc,
                    qrCode,
                    pdfDoc.embedPng(qrCode)
                ]);
            }).then(function (vals) {
                const pdfDoc = vals[0];
                const qrCode = vals[1];
                const emebedded = vals[2];

                let page = pdfDoc.getPages()[0];

                page.drawImage(emebedded, {
                    x: page.getWidth() - 156,
                    y: 100,
                    width: 92,
                    height: 92
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
                    qrCode,
                    pdfDoc.save(),
                    caches.open(cacheAttestName)
                ]);
            }).then(function (vals) {
                const qrCode = vals[0];
                const pdfBytes = vals[1];
                const cache = vals[2];

                const pdfBlob = new Blob([pdfBytes], {
                    type: 'application/pdf'
                });

                return Promise.all([
                    qrCode,
                    pdfBlob,
                    cache.put(cachePdfName, new Response(pdfBlob, {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': 'attachment; filename="' + 'attestation_' + (formatDate(fieldsData['dateSortie']).replace(/ /g, '-')) + '.pdf"',
                            'Content-Transfer-Encoding': 'binary',
                            'Expires': 0,
                            'Cache-Control': 'must-revalidate, post-check=0, pre-check=0',
                            'Pragma': 'public',
                            'Content-length': pdfBlob.size
                        }
                    }))
                ]);
            }).then(function (vals) {
                const qrCode = vals[0];
                const pdfBlob = vals[1];

                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    downloadSw(cachePdfName);
                } else {
                    downloadBlob(pdfBlob);
                }

                qrDiv = document.createElement('div');
                qrDiv.classList.add('qr');

                const img = document.createElement('img');
                img.alt = 'QR Code';
                img.src = qrCode;
                qrDiv.appendChild(img);

                const p = document.createElement('p');
                p.innerHTML = data.join('<br />');
                qrDiv.appendChild(p);

                document.body.appendChild(qrDiv);
            });
        };

    document.getElementById('back').addEventListener('click', function (e) {
        e.preventDefault();

        switch (step) {
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
            // Show the update button to the user and wait for a click on it
            const _reqUpdate = function () {
                return new Promise(function (resolve, reject) {
                    const refreshButton = document.createElement('a');
                    refreshButton.href = '#';
                    refreshButton.classList.add('refreshBut', 'appBut');
                    refreshButton.innerText = 'Mettre à jour';

                    refreshButton.addEventListener('click', function (e) {
                        resolve();
                    });

                    document.body.appendChild(refreshButton);
                });
            };

            // Call this function when an update is ready to show the button and request update
            const _updateReady = function (worker) {
                return _reqUpdate()
                    .then(function () {
                        // post message to worker to make him call skiWaiting for us
                        worker.postMessage({
                            action: 'skipWaiting'
                        });
                    })
                    .catch(() => {
                        console.log('Rejected new version');
                    });
            };

            // Track state change on worker and request update when ready
            const _trackInstalling = function (worker) {
                worker.addEventListener('statechange', () => {
                    if (worker.state == 'installed') {
                        _updateReady(worker);
                    }
                });
            };

            const showVersion = function () {
                const version = document.getElementById('version');
                if (version && version.dataset.v) {
                    fetch(version.dataset.v)
                        .then(function (response) {
                            return response.json();
                        })
                        .then(function (response) {
                            const date = new Date(response.time);
                            version.innerText = response.v + ' - ' + formatDate(date, false, 'à');
                        });
                }
            };

            let refreshing;
            // When skiwaiting is called, reload the page only once
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) {
                    return;
                }
                refreshing = true;
                window.location.reload();
            });

            navigator.serviceWorker.register(document.body.dataset.sw).then((registration) => {
                if (!navigator.serviceWorker.controller) {
                    return;
                }

                showVersion();

                if (registration.waiting) {
                    // There is another SW waiting, the user can switch
                    _updateReady(registration.waiting);
                    return;
                }

                if (registration.installing) {
                    // There is another SW installing, listen to it to know when it's ready/waiting
                    _trackInstalling(registration.installing);
                    return;
                }

                // If an update if found later, track the installing too
                registration.addEventListener('updatefound', () => {
                    _trackInstalling(registration.installing);
                });

            }, (err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }

    // Prompt install
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        let deferredPrompt = e;

        const installButton = document.createElement('a');
        installButton.href = '#';
        installButton.classList.add('installBut', 'appBut');
        installButton.innerText = 'Installer';

        installButton.addEventListener('click', function (e) {
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