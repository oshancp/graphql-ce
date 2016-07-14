/**
 * Copyright © 2016 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */

'use strict';

angular.module('extension-grid', ['ngStorage'])
    .controller('extensionGridController', ['$rootScope', '$scope', '$http', '$localStorage', '$state',
        function ($rootScope, $scope, $http, $localStorage, $state) {
            $rootScope.extensionsProcessed = false;
            $scope.syncError = false;
            $http.get('index.php/extensionGrid/extensions').success(function (data) {
                $scope.extensions = data.extensions;
                $scope.total = data.total;

                if (typeof data.lastSyncData.lastSyncDate === 'undefined') {
                    $scope.isOutOfSync = true;
                    $scope.countOfUpdate = 0;
                    $scope.countOfInstall = 0;
                } else {
                    $scope.lastSyncDate = data.lastSyncData.lastSyncDate.date;
                    $scope.lastSyncTime = data.lastSyncData.lastSyncDate.time;
                    $scope.countOfUpdate = data.lastSyncData.countOfUpdate;
                    $scope.countOfInstall = data.lastSyncData.countOfInstall;
                    $scope.enabledInstall = data.lastSyncData.countOfInstall ? true : false;
                    $scope.isOutOfSync = false;
                }
                $scope.availableUpdatePackages = data.lastSyncData.packages;
                $scope.currentPage = 1;
                $scope.rowLimit = 20;
                $scope.numberOfPages = Math.ceil($scope.total / $scope.rowLimit);
                $rootScope.extensionsProcessed = true;
            });

            $scope.$watch('currentPage + rowLimit', function () {
                var begin = ($scope.currentPage - 1) * $scope.rowLimit;
                var end = parseInt(begin) + parseInt($scope.rowLimit);
                $scope.numberOfPages = Math.ceil($scope.total / $scope.rowLimit);

                if ($scope.currentPage > $scope.numberOfPages) {
                    $scope.currentPage = $scope.numberOfPages;
                }
            });

            $scope.isOutOfSync = false;
            $scope.isHiddenSpinner = true;
            $scope.selectedExtension = null;

            $scope.isActiveActionsCell = function(extension) {
                return $scope.selectedExtension === extension;
            };

            $scope.toggleActiveActionsCell = function(extension) {
                $scope.selectedExtension = $scope.selectedExtension == extension ? null : extension;
            };

            $scope.closeActiveActionsCell = function(extension) {
                $scope.toggleActiveActionsCell(extension);
            };

            $scope.predicate = 'name';
            $scope.reverse = false;
            $scope.order = function(predicate) {
                $scope.reverse = $scope.predicate === predicate ? !$scope.reverse : false;
                $scope.predicate = predicate;
            };

            $scope.sync = function() {
                $scope.isHiddenSpinner = false;
                $http.get('index.php/extensionGrid/sync').success(function(data) {
                    if (typeof data.lastSyncData.lastSyncDate !== 'undefined') {
                        $scope.lastSyncDate = data.lastSyncData.lastSyncDate.date;
                        $scope.lastSyncTime = data.lastSyncData.lastSyncDate.time;
                    }

                    if (data.error !== '') {
                        $scope.syncError = true;
                        $scope.ErrorMessage = data.error;
                    }
                    $scope.availableUpdatePackages = data.lastSyncData.packages;
                    $scope.countOfUpdate = data.lastSyncData.countOfUpdate;
                    $scope.countOfInstall = data.lastSyncData.countOfInstall;
                    $scope.enabledInstall = data.lastSyncData.countOfInstall ? true : false;
                    $scope.isHiddenSpinner = true;
                    $scope.isOutOfSync = false;
                });
            };
            $scope.isAvailableUpdatePackage = function(packageName) {
                $localStorage.isMarketplaceAuthorized = typeof $localStorage.isMarketplaceAuthorized !== 'undefined' ? $localStorage.isMarketplaceAuthorized : false;
                var isAvailable = typeof $scope.availableUpdatePackages !== 'undefined'
                    && $localStorage.isMarketplaceAuthorized
                    && packageName in $scope.availableUpdatePackages;
                return isAvailable;
            };

            $scope.getIndicatorInfo = function (extension, type) {
                var indicators = {
                    'info': {
                        'icon': '_info', 'label': 'Update Available'
                    }
                };

                var types = ['label', 'icon'];

                if (types.indexOf(type) === -1) {
                    type = 'icon';
                }

                if ($scope.isAvailableUpdatePackage(extension.name)) {
                    return indicators.info[type];
                }
            };

            $scope.update = function(extension) {
                $localStorage.packages = [
                    {
                        name: extension.name,
                        version: $scope.availableUpdatePackages[extension.name]['latestVersion']
                    }
                ];
                if (extension.moduleName) {
                    $localStorage.moduleName = extension.moduleName;
                } else {
                    $localStorage.moduleName = extension.name;
                }
                if ($localStorage.titles['update'].indexOf($localStorage.moduleName) < 0 ) {
                    $localStorage.titles['update'] = 'Update ' + $localStorage.moduleName;
                }
                $rootScope.titles = $localStorage.titles;
                $scope.nextState();
            };

            $scope.uninstall = function(extension) {
                $localStorage.packages = [
                    {
                        name: extension.name
                    }
                ];
                if (extension.moduleName) {
                    $localStorage.moduleName = extension.moduleName;
                } else {
                    $localStorage.moduleName = extension.name;
                }
                if ($localStorage.titles['uninstall'].indexOf($localStorage.moduleName) < 0 ) {
                    $localStorage.titles['uninstall'] = 'Uninstall ' + $localStorage.moduleName;
                }
                $rootScope.titles = $localStorage.titles;
                $localStorage.extensionType = extension.type;
                $state.go('root.readiness-check-uninstall');
            };
        }
    ])
    .filter('startFrom', function () {
        return function (input, start) {
            if (input !== undefined && start !== 'NaN') {
                start = parseInt(start, 10);
                return input.slice(start);
            }
        }
    });
