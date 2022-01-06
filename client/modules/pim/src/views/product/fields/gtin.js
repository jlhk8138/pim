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

Espo.define('pim:views/product/fields/gtin', 'views/fields/varchar',
    Dep => Dep.extend({
        setup() {
            Dep.prototype.setup.call(this);

            this.validations = Espo.utils.clone(this.validations);
            this.validations.push('valid');
        },

        validateValid() {
            const value = this.model.get(this.name);
            if (value !== null && !this.isGtinValid(value)) {
                this.showValidationMessage(this.translate('Not valid', 'error'));
                return true;
            }

            return false;
        },

        isGtinValid(value) {
            while (value.length < 14) {
                value = '0' + value;
            }

            let mult = [];
            [...value].forEach((item, key) => {
                if (key !== 13) {
                    mult.push(parseInt(item) * ((key % 2 === 0) ? 3 : 1));
                }
            });

            let sum = mult.reduce((acc, val) => acc + val);

            return  (10 - (sum % 10)) % 10 === parseInt(value[13]);
        }
    })
);
