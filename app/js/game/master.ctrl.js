(function() {
    'use strict';

    // the `highest` controller the app
    angular.module('magicsquares').controller('Master', ['Model', '$scope', function(Model, $scope) {

        console.log('hi from master!');

        var self = this;

        // true when all rows, columns and diagonals add up to the `magic number`
        this.allCorrect = false;

        // the number of selected items ( those `drag` items which have been dropped )
        this.selected = 0;

        // true if the user has dropped a `drag` item on all the `drop` items
        this.complete = false;

        // true if the user has just checked their selections
        // ( will be falsified once another selection is made )
        this.checked = false;

        // watches for any change in the `game state`
        $scope.$watch(Model.getUpdateValues, function(newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                self.allCorrect = Boolean(newValue.correct);
                self.selected = newValue.selected;
                self.complete = newValue.complete;
                if (!self.complete) {
                    self.checked = false;
                } else if (self.complete && self.checked) {
                    self.checked = false;
                }
            }
        });

        // user `hint` function to display the completed values
        this.check = function() {
            this.checked = true;
        };
        /**
         * Resets the game
         */
        this.clear = function() {
            Model.clear();
        };
    }]);
}());
