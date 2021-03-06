/* eslint-env jquery */
/* global moment:false, checkMissingData:false, callUpdate:false */
/*
 * ------------------------------------------------------------------------
 *  Copyright by KNIME AG, Zurich, Switzerland
 *  Website: http://www.knime.com; Email: contact@knime.com
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License, Version 3, as
 *  published by the Free Software Foundation.
 *
 *  This program is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, see <http://www.gnu.org/licenses>.
 *
 *  Additional permission under GNU GPL version 3 section 7:
 *
 *  KNIME interoperates with ECLIPSE solely via ECLIPSE's plug-in APIs.
 *  Hence, KNIME and ECLIPSE are both independent programs and are not
 *  derived from each other. Should, however, the interpretation of the
 *  GNU GPL Version 3 ("License") under any applicable laws result in
 *  KNIME and ECLIPSE being a combined program, KNIME AG herewith grants
 *  you the additional permission to use and propagate KNIME together with
 *  ECLIPSE with only the license terms in place for ECLIPSE applying to
 *  ECLIPSE and the GNU GPL Version 3 applying for KNIME, provided the
 *  license terms of ECLIPSE themselves allow for the respective use and
 *  propagation of ECLIPSE together with KNIME.
 *
 *  Additional permission relating to nodes for KNIME that extend the Node
 *  Extension (and in particular that are based on subclasses of NodeModel,
 *  NodeDialog, and NodeView) and that only interoperate with KNIME through
 *  standard APIs ("Nodes"):
 *  Nodes are deemed to be separate and independent programs and to not be
 *  covered works.  Notwithstanding anything to the contrary in the
 *  License, the License does not apply to Nodes, you are not required to
 *  license Nodes under the License, and you are granted a license to
 *  prepare and propagate Nodes, in each case even if such Nodes are
 *  propagated with or for interoperation with KNIME.  The owner of a Node
 *  may freely choose the license terms applicable to such Node, including
 *  when such Node is propagated with or for interoperation with KNIME.
 * ------------------------------------------------------------------------
 *
 * History
 *   May 23, 2019 (Christian Albrecht, KNIME GmbH, Konstanz, Germany): created
 */
window.knimeDateWidget = (function () {
    var dateWidget = {
        version: '2.0.0'
    };
    dateWidget.name = 'Date&Time input';
    var viewValid = false;
    var viewRepresentation, zoneInput, dateInput, hourInput, minInput, secInput, milliInput, errorMessage, date, zone,
        minDate, maxDate, format, granularity;
    
    function padZero(value, pad) {
        if (String.prototype.padStart) {
            return value.toString().padStart(pad, '0');
        } else {
            // no extra effort taken here
            return value;
        }
    }
    
    function validateMinMax() {
        if (!viewValid) {
            return null;
        }

        // if only a time is set, make sure the date is the same
        if (viewRepresentation.type === 'LT') {
            if (minDate !== null) {
                minDate.year(date.year()).month(date.month()).date(date.date());
            }
            if (maxDate !== null) {
                maxDate.year(date.year()).month(date.month()).date(date.date());
            }
        }

        if (minDate && date.isBefore(minDate)) {
            errorMessage.text('The set date&time \'' + date.format(format) + '\' must not be before \'' +
                minDate.format(format) + '\'.');
            errorMessage.css('display', 'inline');
            return false;
        } else if (maxDate && date.isAfter(maxDate)) {
            errorMessage.text('The set date&time \'' + date.format(format) + '\' must not be after \'' +
                maxDate.format(format) + '\'.');
            errorMessage.css('display', 'inline');
            return false;
        }
        errorMessage.text('');
        errorMessage.css('display', 'none');
        return true;
    }
    
    function refreshTime() {
        if (granularity === 'show_minutes') {
            date.set('second', 0);
        }
        if (granularity !== 'show_millis') {
            date.set('millisecond', 0);
        }
        validateMinMax();
        // If datepicker is not disabled setDate will reopen the picker in IE
        dateInput.datepicker('disable');
        dateInput.datepicker('setDate', date.toDate());
        dateInput.datepicker('enable');
        hourInput.val(padZero(date.get('hour'), 2));
        minInput.val(padZero(date.get('minute'), 2));
        secInput.val(padZero(date.get('second'), 2));
        milliInput.val(padZero(date.get('millisecond'), 3));
        zoneInput.val(zone);
    }

    function parseZDT(data) {
        var regex = /(.*)\[(.*)\]$/;
        var match = regex.exec(data);

        if (match === null) {
            return [new Date(data), null];
        }
        // idx = match[1].indexOf('+');
        return [new Date(match[1]), match[2]];
    }

    dateWidget.init = function (representation) {
        if (checkMissingData(representation)) {
            return;
        }
        viewRepresentation = representation;
        var dateValue = representation.currentValue.datestring;
        var parsedDate = parseZDT(dateValue);
        zone = parsedDate[1];
        date = viewRepresentation.usedefaultexectime ? moment.tz(new Date(), zone) : moment.tz(parsedDate[0], zone);
        if (viewRepresentation.usemin) {
            var parsedMin = parseZDT(viewRepresentation.min);
            var minZone = parsedMin[1];
            minDate = viewRepresentation.useminexectime ? moment.tz(new Date(), minZone) : moment.tz(parsedMin[0],
                minZone);
        }
        if (viewRepresentation.usemax) {
            var parsedMax = parseZDT(viewRepresentation.max);
            var maxZone = parsedMax[1];
            maxDate = viewRepresentation.usemaxexectime ? moment.tz(new Date(), maxZone) : moment.tz(parsedMax[0],
                maxZone);
        }
        var type = representation.type;
        granularity = representation.granularity;
        if (type === 'LT') {
            format = 'HH:mm:ss';
        } else if (type === 'LD') {
            format = 'YYYY-MM-DD';
        } else if (type === 'LDT') {
            format = 'YYYY-MM-DDTHH:mm:ss';
        } else {
            format = '';
        }
        var body = $('body');
        var qfdiv = $('<div class="quickformcontainer knime-qf-container" style="display:table" ' +
            'data-iframe-height data-iframe-width>');
        body.append(qfdiv);
        var dateElement = $('<div class="knime-datetime knime-date" style="display:inline-block">');
        var timeElement = $('<div class="knime-datetime knime-time" style="display:inline-block">');
        var nowButtonElement = $('<div class="knime-datetime knime-now" style="display:inline-block">');
        var zoneElement = $('<div class="knime-datetime knime-timezone" style="display:inline-block">');

        // === add date picker ===
        var dateLabel = $('<label>Date: </label>');
        dateLabel.attr('id', 'dateLabel');
        dateLabel.attr('class', 'knime-qf-label');
        dateElement.append(dateLabel);
        dateInput = $('<input>');
        dateInput.attr('class', 'knime-qf-input knime-datetime knime-date knime-single-line');
        dateInput.attr('aria-label', representation.label + ' - date field');
        qfdiv.attr('title', representation.description);
        qfdiv.attr('aria-label', representation.label);
        qfdiv.append('<div class="label knime-qf-title">' + representation.label + '</div>');
        dateElement.append(dateInput);
        dateInput
            .datepicker({
                showAnim: '',
                showOn: 'both',
                // eslint-disable-next-line max-len
                buttonImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAolBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgESU6AAAANXRSTlMAAgMJDA0OEBESFxoeISQlKC4vMzdFSU1OWFtiZn6RlZeqr7K1t7m6vMDIys/T3OLk7fP5+zyLoWgAAACpSURBVBhXjdDJFoIwDAXQgiiopM4zxogEFZw1//9rtqALF3J4i7zmnqyqlE3gFaX8Ztk2e5GV7Y1I9LVAGqOHaVe6Q9smDszFAdFaj8ULRbctpiIWixgUaRm0i9sv0e+ZAR/8SYEn5kvGfGfmc85cohlTXyk070Gn3P9gSpTHRDciOu6IKi7rY4KYbRGviHiIESsua+NzAbCeACQAEM0AJDS4fP3+R+qoN61LIJoYOqi6AAAAAElFTkSuQmCC',
                buttonImageOnly: true,
                buttonText: 'Open calendar',
                dateFormat: 'yy-mm-dd',
                showButtonPanel: true,
                changeYear: true,
                onSelect: function (dateText) {
                    var newDate = $(this).datepicker('getDate');
                    date.set('year', newDate.getFullYear());
                    date.set('month', newDate.getMonth());
                    date.set('date', newDate.getDate());
                    refreshTime();
                    $(this).blur();
                },
                onClose: function (dateText) {
                    if (isNaN(new Date(dateText).getTime())) {
                        // if date is not valid, refresh
                        refreshTime();
                    } else {
                        var newDate = $(this).datepicker('getDate');
                        date.set('year', newDate.getFullYear());
                        date.set('month', newDate.getMonth());
                        date.set('date', newDate.getDate());
                        refreshTime();
                        $(this).blur();
                    }
                }
            });

        $('#ui-datepicker-div').attr({
            'data-iframe-height': '',
            'data-iframe-width': ''
        }).addClass('knime-qf-input knime-datetime knime-date');

        if (viewRepresentation.usemin) {
            dateInput.datepicker('option', 'minDate', minDate.toDate());
        }
        if (viewRepresentation.usemax) {
            dateInput.datepicker('option', 'maxDate', maxDate.toDate());
        }
        qfdiv.append(dateElement);
        if (type === 'LT') {
            dateElement.css('display', 'none');
        }
        qfdiv.append('&nbsp;');
        $('.ui-datepicker-trigger').addClass('knime-qf-button knime-datetime knime-date');

        // === add time spinner ===
        // add hours field to time spinner
        timeElement.append('<span class="knime-qf-label">Time: </span>');
        hourInput = $('<input>');
        hourInput.attr('class', 'knime-qf-input knime-datetime knime-time knime-integer');
        hourInput.attr('aria-label', 'Hours');
        timeElement.append(hourInput);
        hourInput.spinner({
            spin: function (event, ui) {
                date.set('hour', ui.value);
                refreshTime();
                return false;
            }
        });
        hourInput.focusout(function () {
            if (!isNaN(hourInput.val())) {
                date.set('hour', hourInput.val());
            }
            refreshTime();
        });

        // add minutes field to time spinner
        timeElement.append('<span class="knime-qf-label"> <b>:</b> </span>');
        minInput = $('<input>');
        minInput.attr('class', 'knime-qf-input knime-datetime knime-time knime-integer');
        minInput.attr('aria-label', 'Minutes');
        timeElement.append(minInput);
        minInput.spinner({
            spin: function (event, ui) {
                date.set('minute', ui.value);
                refreshTime();
                return false;
            }
        });
        minInput.focusout(function () {
            if (!isNaN(minInput.val())) {
                date.set('minute', minInput.val());
            }
            refreshTime();
        });

        // add seconds field to time spinner
        secInput = $('<input>');
        secInput.attr('class', 'knime-qf-input knime-datetime knime-time knime-integer');
        if (granularity !== 'show_minutes') {
            timeElement.append('<span class="knime-qf-label"> <b>:</b> </span>');
            timeElement.append(secInput);
        }
        secInput.attr('aria-label', 'Seconds');
        secInput.spinner({
            spin: function (event, ui) {
                date.set('second', ui.value);
                refreshTime();
                return false;
            }
        });
        secInput.focusout(function () {
            if (!isNaN(secInput.val())) {
                date.set('second', secInput.val());
            }
            refreshTime();
        });

        // add milliseconds field to time spinner
        milliInput = $('<input>');
        milliInput.attr('class', 'knime-qf-input knime-datetime knime-time knime-integer');
        if (granularity === 'show_millis') {
            timeElement.append('<span class="knime-qf-label"> <b>:</b> </span>');
            timeElement.append(milliInput);
        }
        milliInput.attr('id', 'millis');
        milliInput.attr('aria-label', 'Milliseconds');
        milliInput.spinner({
            spin: function (event, ui) {
                date.set('millisecond', ui.value);
                refreshTime();
                return false;
            }
        });
        milliInput.focusout(function () {
            if (!isNaN(milliInput.val())) {
                date.set('millisecond', milliInput.val());
            }
            refreshTime();
        });

        qfdiv.append(timeElement);
        if (type === 'LD') {
            timeElement.css('display', 'none');
        }

        $('.ui-spinner').addClass('knime-spinner knime-datetime knime-time');

        if (representation.shownowbutton) {
            qfdiv.append('&nbsp;');
        }
        // === add now button ===
        var nowButton = $('<button>Now</button>');
        nowButton.attr('id', 'nowButton');
        nowButton.attr('aria-label', 'Now');
        nowButton.attr('class', 'knime-qf-button knime-datetime knime-now');
        nowButtonElement.append(nowButton);

        nowButton.click(function () {
            date = moment();
            zone = moment.tz.guess();
            refreshTime();
        });

        qfdiv.append(nowButtonElement);
        if (!representation.shownowbutton) {
            nowButtonElement.css('display', 'none');
        }

        qfdiv.append($('<br>'));

        // === add zone selection ===
        var zones = viewRepresentation.zones;
        var zoneLabel = $('<label>Time Zone: </label>');
        zoneLabel.attr('id', 'zoneLabel');
        zoneLabel.attr('class', 'knime-qf-label knime-datetime knime-time');
        zoneElement.append(zoneLabel);
        zoneInput = $('<select id="time_zone_select">');
        zoneInput.attr('id', 'zoneList');
        zoneInput.attr('aria-label', 'Time Zone');
        zoneInput.attr('class', 'knime-qf-select knime-datetime knime-timezone');

        $.each(zones, function (i, zone) {
            zoneInput.append($('<option>', {
                value: zone,
                text: zone
            }));
        });

        zoneInput.on('change', function () {
            zone = zoneInput.val();
            refreshTime();
        });

        zoneElement.append(zoneInput);
        zoneElement.css('width', '100%');
        qfdiv.append(zoneElement);
        if (!(type === 'ZDT')) {
            zoneElement.css('display', 'none');
        }

        qfdiv.append($('<br>'));
        errorMessage = $('<span class="knime-qf-error">');
        errorMessage.css('display', 'none');
        errorMessage.attr('role', 'alert');
        qfdiv.append(errorMessage);

        var allInputs = $('input');
        allInputs.height(20);
        allInputs.width(20);
        dateInput.width(108);

        if (type === 'ZDT') {
            dateLabel.css('width', '80px');
        } else {
            dateLabel.css('width', '40px');
        }

        refreshTime();
        dateInput.blur(callUpdate);
        hourInput.blur(callUpdate);
        minInput.blur(callUpdate);
        secInput.blur(callUpdate);
        milliInput.blur(callUpdate);
        viewValid = true;
    };

    dateWidget.value = function () {
        if (!viewValid) {
            return null;
        }
        var viewValue = {};
        viewValue.datestring = date.format('YYYY-MM-DDTHH:mm:ss.SSS');
        viewValue.zonestring = zone;
        return viewValue;
    };

    dateWidget.validate = function () {
        if (!viewValid) {
            return false;
        }
        var valid = validateMinMax();
        return valid;
    };

    dateWidget.setValidationErrorMessage = function (message) {
        if (!viewValid) {
            return;
        }
        if (message === null) {
            errorMessage.text('');
            errorMessage.css('display', 'none');
        } else {
            errorMessage.text(message);
            errorMessage.css('display', 'inline');
        }
    };

    return dateWidget;

})();
