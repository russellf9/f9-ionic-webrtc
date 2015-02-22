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
            var result = '';
            switch (index) {
                // top left diagonal
                case 0:
                {
                    result = Model.getDiagonalTotal(1);
                    break;
                }
                // top columns
                case 1:
                {
                    result = Model.getColumnTotal(1);
                    break;
                }
                case 2:
                {
                    result = Model.getColumnTotal(2);
                    break;
                }
                case 3:
                {
                    result = Model.getColumnTotal(3);
                    break;
                }
                // top right diagonal
                case 4:
                {
                    result = Model.getDiagonalTotal(2);
                    break;
                }
                // rows
                case 5:
                {
                    result = Model.getRowTotal(1);
                    break;
                }
                case 9:
                {
                    result = Model.getRowTotal(1);
                    break;
                }
                case 10:
                {
                    result = Model.getRowTotal(2);
                    break;
                }
                case 14:
                {
                    result = Model.getRowTotal(2);
                    break;
                }
                case 15:
                {
                    result = Model.getRowTotal(3);
                    break;
                }
                case 19:
                {
                    result = Model.getRowTotal(3);
                    break;
                }
                // bottom left diagonal
                case 20:
                {
                    result = Model.getDiagonalTotal(2);
                    break;
                }
                // bottom columns
                case 21:
                {
                    result = Model.getColumnTotal(1);
                    break;
                }
                case 22:
                {
                    result = Model.getColumnTotal(2);
                    break;
                }
                case 23:
                {
                    result = Model.getColumnTotal(3);
                    break;
                }
                // bottom right diagonal
                case 24:
                {
                    result = Model.getDiagonalTotal(1);
                    break;
                }
            }
            return result;
        }

    }]);
}());