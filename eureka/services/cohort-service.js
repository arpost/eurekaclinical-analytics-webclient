(function() {
    'use strict';

    /**
     * @ngdoc service
     * @name eureka.CohortService
     * @description
     * This service provides an API to interact with the REST endpoint for cohorts.
     * @requires $http
     * @requires $q
     */

    angular
        .module('eureka')
        .factory('CohortService', CohortService);

    CohortService.$inject = ['$http', '$q', 'ProxyService'];

    function CohortService($http, $q, ProxyService) {

        var dataEndpoint = ProxyService.getDataEndpoint();
	
        return ({
            getCohorts: getCohorts,
            getCohort: getCohort,
            getSystemElement: getSystemElement,
            getPhenotypes: getPhenotypes,
            removeCohort: removeCohort,
            createCohort: createCohort,
            updateCohort: updateCohort
        });

        function getCohorts() {

            var type = 'COHORT';
            return $http.get(dataEndpoint + '/destinations?type=' + type)
                .then(handleSuccess, handleError);

        }

        function removeCohort(key) {

            return $http['delete'](dataEndpoint + '/destinations/' + key)
                .then(handleSuccess, handleError);

        }

        function getSystemElement(key) {

            return $http.get(dataEndpoint + '/concepts/' + key + '?summary=true')
                .then(handleSuccess, handleError);

        }

        function getCohort(cohortId) {
            return $http.get(dataEndpoint + '/destinations/' + cohortId)
                .then(handleSuccess, handleError);

        }

        function getPhenotypes(cohort) {


            var cohorts = [];

            function traverse(node) {

                if (node.left_node !== undefined) {
                    traverse(node.left_node);
                }

                if (node.name !== undefined) {
                    cohorts.push(node.name);
                }

                if (node.right_node !== undefined) {
                    traverse(node.right_node);
                }
            }

            traverse(cohort.node);

            var promises = [];
            angular.forEach(cohorts, function(cohort) {
                var promise = $http.get(dataEndpoint + '/concepts/' + cohort + '?summary=true');
                promises.push(promise);

            });

            return $q.all(promises);

        }

        function createCohort(cohort) {
            let newCohort = {
                id: null,
		name: cohort.name,
		description: cohort.description,
                type: 'COHORT',
		ownerUserId: cohort.userId,
                phenotypeFields: null,
                cohort: {
                    id: null
                },
		ownerUserId: null,
                read: false,
                write: false,
                execute: false,
                created_at: null,
                updated_at: null,
                links: null
            };
            let phenotypes = cohort.memberList;
            let node = { id: null, start: null, finish: null, type: 'Literal' };
            if (phenotypes.length === 1) {
                node.name = phenotypes[0].name;
            } else if (phenotypes.length > 1) {
                let first = true;
                let prev = null;
                for (var i = phenotypes.length - 1; i >= 0; i--) {
                    var literal = { id: null, start: null, finish: null, type: 'Literal' };
                    literal.name = phenotypes[i].name;
                    if (first) {
                        first = false;
                        prev = literal;
                    } else {
                        var binaryOperator = { id: null, type: 'BinaryOperator', op: 'OR' };
                        binaryOperator.left_node = literal;
                        binaryOperator.right_node = prev;
                        prev = binaryOperator;
                    }
                }
                node = prev;
            } else {
                node = null;
            }
            newCohort.cohort.node = node;
            return $http.post(dataEndpoint + '/destinations/', newCohort)
                .then(handleSuccess, handleError);
        }


        function updateCohort(cohort) {
            // will need to clean up after getting it to work; JS
            let newCohort = {
                id: null,
                type: 'COHORT',
                ownerUserId: 1,
                phenotypeFields: null,
                cohort: {
                    id: null
                },
                read: false,
                write: false,
                execute: false,
                created_at: null,
                updated_at: null,
                links: null
            };

            let existingList = [];

            let phenotypes = cohort.memberList;

            let node = { id: null, start: null, finish: null, type: 'Literal' };
            if (phenotypes.length === 1) {
                node.name = phenotypes[0].name;
            } else if (phenotypes.length > 1) {
                let first = true;
                let prev = null;
                for (var i = phenotypes.length - 1; i >= 0; i--) {
                    var literal = { id: null, name: phenotypes[i].name, start: null, finish: null, type: 'Literal' };
                    if (first) {
                        first = false;
                        prev = literal;
                    } else {
                        var binaryOperator = { id: null, type: 'BinaryOperator', op: 'OR' };
                        binaryOperator.left_node = literal;
                        binaryOperator.right_node = prev;
                        prev = binaryOperator;
                    }
                }
                node = prev;
            } else {
                node = null;
            }


            newCohort.name = cohort.name;
            newCohort.description = cohort.description;
            newCohort.id = cohort.id;
            newCohort.cohort.node = node;

            return $http.put(dataEndpoint + '/destinations/', newCohort)
                .then(handleSuccess, handleError);
        }

        function handleSuccess(response) {
            return response.data;
        }

        function handleError(response) {
            if (!angular.isObject(response.data) && !response.data) {
		if (response.statusText) {
                    return ($q.reject(response.statusText));
                } else {
                    return ($q.reject('The server may be down.'));
                }
            }
            return ($q.reject(response.data));
        }

    }

}());
