/*
 * This file is part of AtroPIM.
 *
 * AtroPIM - Open Source PIM application.
 * Copyright (C) 2020 AtroCore UG (haftungsbeschränkt).
 * Website: https://atropim.com
 *
 * AtroPIM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AtroPIM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AtroPIM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "AtroPIM" word.
 */

Espo.define('pim:views/fields/enum-default', 'views/fields/enum', function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            this.setOptionList(this.getOptionListItems());
            this.listenTo(this.model, 'change:typeValue', function () {
                this.setOptionList(this.getOptionListItems());
            }, this);
        },

        getOptionListItems() {
            let options = [];
            if (this.model.get('typeValue')) {
                options = Espo.Utils.clone(this.model.get('typeValue'));
            }
            options.unshift('');

            return options;
        },

        validate() {
            if (this.model.get('prohibitedEmptyValue') && this.model.get('enumDefault') === '') {
                this.showValidationMessage(this.translate('defaultValueCannotBeEmpty', 'messages'));
                return true;
            }

            return false;
        },

    });

});
