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

Espo.define('pim:views/category/record/tree-panel', ['view', 'lib!JsTree'],
    Dep => Dep.extend({

        template: 'pim:category/record/tree-panel',

        events: {
            'click button[data-action="collapsePanel"]': function () {
                this.actionCollapsePanel();
            },

            'click .reset-tree-filter': function () {
                this.trigger('tree-reset');
            }
        },

        setup() {
            this.scope = this.options.scope || this.scope;
            this.treeScope = this.scope;

            if (this.scope === 'Product') {
                this.treeScope = localStorage.getItem('treeScope') || 'Category';
            }

            this.wait(true);
            this.buildSearch();
            this.wait(false);
        },

        data() {
            return {
                scope: this.scope,
                treeScope: this.treeScope
            }
        },

        afterRender() {
            Dep.prototype.afterRender.call(this);

            this.buildTree();

            this.actionCollapsePanel('open');
            if ($(window).width() <= 767 || !!this.getStorage().get('catalog-tree-panel', this.scope)) {
                this.actionCollapsePanel();
            }

            let interval = setInterval(() => {
                if ($('.catalog-tree-panel').length === 0) {
                    clearInterval(interval);
                    return;
                }
                const title = this.translate("useDragAndDrop");
                $('.jqtree-title:not([title="' + title + '"])').attr('title', title);
            }, 100);
        },

        selectTreeNode(route, id) {
            const $tree = this.getTreeEl();

            $tree.tree('selectNode', $tree.tree('getNodeById', id));

            if (route.length > 0) {
                let node = $tree.tree('getNodeById', route.shift());
                $tree.tree('openNode', node, () => {
                    this.selectTreeNode(route, id);
                });
            }
        },

        parseRoute(routeStr) {
            let route = [];
            (routeStr || '').split('|').forEach(item => {
                if (item) {
                    route.push(item);
                }
            });

            return route;
        },

        buildTree() {
            const $tree = this.getTreeEl();

            $tree.tree('destroy');
            $tree.tree({
                dataUrl: this.treeScope + '/action/Tree',
                selectable: true,
                dragAndDrop: true,
                useContextMenu: false,
                closedIcon: $('<i class="fa fa-angle-right"></i>'),
                openedIcon: $('<i class="fa fa-angle-down"></i>')
            }).on('tree.init', () => {
                    this.trigger('tree-init');
                }
            ).on('tree.move', e => {
                e.preventDefault();

                const parentName = this.treeScope === 'Category' ? 'categoryParent' : 'parent';

                let moveInfo = e.move_info;
                let data = {
                    _position: moveInfo.position,
                    _target: moveInfo.target_node.id
                };

                data[parentName + 'Id'] = null;
                data[parentName + 'Name'] = null;

                if (moveInfo.position === 'inside') {
                    data[parentName + 'Id'] = moveInfo.target_node.id;
                    data[parentName + 'Name'] = moveInfo.target_node.name;
                } else if (moveInfo.target_node.parent.id) {
                    data[parentName + 'Id'] = moveInfo.target_node.parent.id
                    data[parentName + 'Name'] = moveInfo.target_node.parent.name;
                }

                this.ajaxPatchRequest(`${this.treeScope}/${moveInfo.moved_node.id}`, data).success(response => {
                    moveInfo.do_move();
                    if (this.model) {
                        this.model.fetch();
                        $('.action[data-action=refresh]').click();
                    }
                });
            }).on('tree.click', e => {
                e.preventDefault();

                if ($(e.click_event.target).hasClass('jqtree-title')) {
                    let node = e.node;

                    let route = [];
                    while (node.parent.id) {
                        route.push(node.parent.id);
                        node = node.parent;
                    }

                    let data = {id: e.node.id, route: ''};
                    if (route.length > 0) {
                        data['route'] = "|" + route.reverse().join('|') + "|";
                    }

                    this.selectNode(data);
                }
            });
        },

        selectNode(data) {
            this.trigger('select-node', data);
        },

        getTreeEl() {
            return this.$el.find('.category-tree');
        },

        buildSearch() {
            this.createView('categorySearch', 'pim:views/category/record/tree-panel/category-search', {
                el: '.catalog-tree-panel > .category-panel > .category-search',
                scope: this.treeScope,
            }, view => {
                view.render();
                this.listenTo(view, 'category-search-select', item => {
                    this.selectNode({id: item.id, route: item.categoryRoute});
                });
            });

            const treeScopes = this.getMetadata().get(`clientDefs.${this.scope}.treeScopes`);
            if (treeScopes) {
                this.getModelFactory().create(this.scope, model => {
                    model.set('scopesEnum', localStorage.getItem('treeScope') || 'Category');

                    let options = [];

                    treeScopes.forEach(scope => {
                        if (this.getAcl().check(scope, 'read')) {
                            options.push(scope);
                        }
                    })

                    let translatedOptions = {};
                    options.forEach(scope => {
                        translatedOptions[scope] = this.translate(scope, 'scopeNames', 'Global');
                    });

                    this.createView('scopesEnum', 'views/fields/enum', {
                        prohibitedEmptyValue: true,
                        model: model,
                        el: `.catalog-tree-panel > .category-panel > .scopes-enum`,
                        defs: {
                            name: 'scopesEnum',
                            params: {
                                options: options,
                                translatedOptions: translatedOptions
                            }
                        },
                        mode: 'edit'
                    }, view => {
                        view.render();
                        this.listenTo(model, 'change:scopesEnum', () => {
                            this.treeScope = model.get('scopesEnum');

                            localStorage.setItem('treeScope', this.treeScope);
                            localStorage.removeItem('selectedNodeId');
                            localStorage.removeItem('selectedNodeRoute');

                            const searchPanel = this.getView('categorySearch');
                            searchPanel.scope = this.treeScope;
                            searchPanel.reRender();

                            this.buildTree();

                            $('button[data-action="search"]').click();
                        });
                    });
                });
            }
        },

        actionCollapsePanel(type) {
            const $categoryPanel = this.$el.find('.category-panel');

            let isCollapsed = $categoryPanel.hasClass('hidden');
            if (type === 'open') {
                isCollapsed = true;
            }

            const $list = $('#tree-list-table');

            if (isCollapsed) {
                $categoryPanel.removeClass('hidden');
                $('.page-header').addClass('collapsed').removeClass('not-collapsed');
                $('#footer').addClass('collapsed').removeClass('not-collapsed');
                if ($list.length > 0) {
                    $list.addClass('collapsed');
                } else {
                    $('.detail-button-container').addClass('collapsed').removeClass('not-collapsed');
                    $('.overview').addClass('collapsed').removeClass('not-collapsed');
                }
                this.showUtilityElements();
            } else {
                $categoryPanel.addClass('hidden');
                $('.page-header').removeClass('collapsed').addClass('not-collapsed');
                $('#footer').addClass('not-collapsed').removeClass('collapsed');
                if ($list.length > 0) {
                    $list.removeClass('collapsed');
                } else {
                    $('.detail-button-container').removeClass('collapsed').addClass('not-collapsed');
                    $('.overview').removeClass('collapsed').addClass('not-collapsed');
                }
                this.hideUtilityElements();
            }

            if (!type) {
                this.getStorage().set('catalog-tree-panel', this.scope, isCollapsed ? '' : 'collapsed');
            }

            $(window).trigger('resize');
        },

        showUtilityElements() {
            let button = this.$el.find('button[data-action="collapsePanel"]');
            button.removeClass('collapsed');
            button.find('span.toggle-icon-left').removeClass('hidden');
            button.find('span.toggle-icon-right').addClass('hidden');

            this.$el.removeClass('catalog-tree-panel-hidden');

            this.$el.addClass('col-xs-12 col-lg-3');
            if (this.model) {

                let detailContainer = this.$el.parents('#main').find('.overview');
                detailContainer.removeClass('col-lg-9');
                detailContainer.addClass('col-lg-6');

            } else {
                let listContainer = this.$el.parents('#main').find('.list-container');
                listContainer.addClass('col-xs-12 col-lg-9');
            }
        },

        hideUtilityElements() {
            let button = this.$el.find('button[data-action="collapsePanel"]');
            button.addClass('collapsed');
            button.find('span.toggle-icon-left').addClass('hidden');
            button.find('span.toggle-icon-right').removeClass('hidden');

            this.$el.addClass('catalog-tree-panel-hidden');

            this.$el.removeClass('col-xs-12 col-lg-3');
            if (this.model) {

                let detailContainer = this.$el.parents('#main').find('.overview');
                detailContainer.addClass('col-lg-9');
                detailContainer.removeClass('col-lg-6');

            } else {
                let listContainer = this.$el.parents('#main').find('.list-container');
                listContainer.removeClass('col-xs-12 col-lg-9');
            }
        },

    })
);