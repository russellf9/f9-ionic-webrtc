(function() {
    'use strict';

    // the controller for the total indicators
    angular.module('magicsquares').controller('Indicator', ['Model', '$scope', function(Model, $scope) {

        var self = this;

        // using a grid pattern to layout the indicators
        this.squares = new Array(Model.getTheNumberOfIndicatorSquares());

        // returns the current result from each indicator in turn
        this.getResult = function(index) {
            return Model.getResult(index);
        };

        // returns a specific CSS class for each indicator to adjust the position of the text
        this.getClass = function(index) {
            return Model.getIndicatorClass(index);
        };

    }]);
}());