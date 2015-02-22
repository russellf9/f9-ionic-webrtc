(function() {
    'use strict';

    // the `highest` controller the app
    angular.module('magicsquares').controller('Indicator', ['Model', '$scope', function(Model, $scope) {

        console.log('hi from indicator!');

        var self = this;


        // watches for any change in the `game state`
        $scope.$watch(Model.getUpdateValues, function(newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
            }
        });

        this.squares = new Array(25);


        this.getResult = function(index) {
            return Model.getResult(index);
        };


        //'indicator-left';
        this.getClass = function(index) {
            return Model.getIndicatorClass(index);
        }

    }]);
}());