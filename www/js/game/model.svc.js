(function() {

    'use strict';

    /**
     * A service which evaluates the games business logic
     */
    angular.module('magicsquares').service('Model', ['_', '$rootScope', function(_, $rootScope) {

        var _numberOfSquares = 9,
            _grandTotal = 45,
            _selectedItems = [],
        // true if a correct solution has been found
            _allCorrect = false,
            _gameValues = {},
            _row1 = 0,
            _row2 = 0,
            _row3 = 0,
            _column1 = 0,
            _column2 = 0,
            _column3 = 0,
            _diagonal1 = 0,
            _diagonal2 = 0,
            _dropItems = [],
            _dragItems = [],

            game = {
                numberOfSquares: function() {
                    return _numberOfSquares;
                },
                grandTotal: function() {
                    return _grandTotal;
                },
                magicNumber: function() {
                    return _grandTotal / 3;
                },
                setSelectedItems: function(value) {
                    _selectedItems = value;
                },
                selectedItems: function() {
                    return _selectedItems;
                },
                allCorrect: function() {
                    return _allCorrect;
                },
                getUpdateValues: function() {
                    return _gameValues;
                },
                getDragItems: function() {
                    return _dragItems;
                },
                getDropItems: function() {
                    return _dropItems;
                },
                // returns th current total of the specified row
                getRowTotal: function(value) {
                    var total = 0;
                    switch (value) {
                        case 1:
                        {
                            total = _row1;
                            break;
                        }
                        case 2:
                        {
                            total = _row2;
                            break;
                        }
                        case 3:
                        {
                            total = _row3;
                            break;
                        }
                    }
                    return total;
                },
                // returns th current total of the specified column
                getColumnTotal: function(value) {
                    var total = 0;
                    switch (value) {
                        case 1:
                        {
                            total = _column1;
                            break;
                        }
                        case 2:
                        {
                            total = _column2;
                            break;
                        }
                        case 3:
                        {
                            total = _column3;
                            break;
                        }
                    }
                    return total;
                },
                // returns the current total of the specified diagonal
                getDiagonalTotal: function(value) {
                    var total = 0;
                    switch (value) {
                        case 1:
                        {
                            total = _diagonal1;
                            break;
                        }
                        case 2:
                        {
                            total = _diagonal2;
                            break;
                        }
                    }
                    return total;
                },
                watchSelectedItems: function() {
                    var self = this;
                    $rootScope.$watchCollection(this.selectedItems, function(newValue, oldValue, scope) {
                        if (newValue && newValue !== oldValue) {
                            self.update();
                        }
                    });
                },
                init: function() {
                    this.setDragItems();
                    this.setDropItems();
                },
                setDragItems: function() {
                    // bit messy here!
                    if (_dragItems.length > 0) {
                        _.forEach(_dragItems, function(drag, key) {
                            _dragItems[key] = {title: String(key + 1), drag: true};
                        });
                    } else {
                        for (var i = 0; i < _numberOfSquares; i++) {
                            _dragItems.push({title: String(i + 1), drag: true});
                        }
                    }
                },
                setDropItems: function() {
                    for (var i = 0; i < _numberOfSquares; i++) {
                        _dropItems.push({value: i});
                    }
                },
                /**
                 * Resets the items
                 */
                clear: function() {
                    this.setDragItems();
                    this.clearDropItems();
                    this.clearSelectedItems();
                    this.update();
                },
                clearDropItems: function() {
                    _dropItems = [];
                    for (var i = 0; i < _numberOfSquares; i++) {
                        _dropItems.push({value: i});
                    }
                },
                clearSelectedItems: function() {
                    _.forEach(_selectedItems, function(drop, key) {
                        if (drop) {
                            _selectedItems[key] = {drag: false};
                        }
                    });
                },
                getTheNumberOfIndicatorSquares : function() {
                    var num = (_numberOfSquares / 3) + 2;
                    return num * num;
                },
                getResult: function(index) {
                    var result = '';
                    switch (index) {
                        // top left diagonal
                        case 0:
                        {
                            result = this.getDiagonalTotal(1);
                            break;
                        }
                        // top columns
                        case 1:
                        {
                            result = this.getColumnTotal(1);
                            break;
                        }
                        case 2:
                        {
                            result = this.getColumnTotal(2);
                            break;
                        }
                        case 3:
                        {
                            result = this.getColumnTotal(3);
                            break;
                        }
                        // top right diagonal
                        case 4:
                        {
                            result = this.getDiagonalTotal(2);
                            break;
                        }
                        // rows
                        case 5:
                        {
                            result = this.getRowTotal(1);
                            break;
                        }
                        case 9:
                        {
                            result = this.getRowTotal(1);
                            break;
                        }
                        case 10:
                        {
                            result = this.getRowTotal(2);
                            break;
                        }
                        case 14:
                        {
                            result = this.getRowTotal(2);
                            break;
                        }
                        case 15:
                        {
                            result = this.getRowTotal(3);
                            break;
                        }
                        case 19:
                        {
                            result = this.getRowTotal(3);
                            break;
                        }
                        // bottom left diagonal
                        case 20:
                        {
                            result = this.getDiagonalTotal(2);
                            break;
                        }
                        // bottom columns
                        case 21:
                        {
                            result = this.getColumnTotal(1);
                            break;
                        }
                        case 22:
                        {
                            result = this.getColumnTotal(2);
                            break;
                        }
                        case 23:
                        {
                            result = this.getColumnTotal(3);
                            break;
                        }
                        // bottom right diagonal
                        case 24:
                        {
                            result = this.getDiagonalTotal(1);
                            break;
                        }
                    }
                    return result;
                },
                getIndicatorClass: function(index) {
                    var style = '';
                    switch (index) {
                        // top left diagonal
                        case 0:
                        {
                            style = 'indicator-top-left';
                            break;
                        }
                        // top columns
                        case 1:
                        {
                            style = 'indicator-top';
                            break;
                        }
                        case 2:
                        {
                            style = 'indicator-top';
                            break;
                        }
                        case 3:
                        {
                            style = 'indicator-top';
                            break;
                        }
                        // top right diagonal
                        case 4:
                        {
                            style = 'indicator-top-right';
                            break;
                        }
                        // rows
                        case 5:
                        {
                            style = 'indicator-left';
                            break;
                        }
                        case 9:
                        {
                            style = 'indicator-right';
                            break;
                        }
                        case 10:
                        {
                            style = 'indicator-left';
                            break;
                        }
                        case 14:
                        {
                            style = 'indicator-right';
                            break;
                        }
                        case 15:
                        {
                            style = 'indicator-left';
                            break;
                        }
                        case 19:
                        {
                            style = 'indicator-right';
                            break;
                        }
                        // bottom left diagonal
                        case 20:
                        {
                            style = 'indicator-bottom-left';
                            break;
                        }
                        // bottom columns
                        case 21:
                        {
                            style = 'indicator-bottom';
                            break;
                        }
                        case 22:
                        {
                            style = 'indicator-bottom';
                            break;
                        }
                        case 23:
                        {
                            style = 'indicator-bottom';
                            break;
                        }
                        // bottom right diagonal
                        case 24:
                        {
                            style = 'indicator-bottom-right';
                            break;
                        }
                    }
                    return style;
                },
                /**
                 * Updates the game values `_gameValues`
                 * To be called each time the collection of dropped items is changed
                 */
                update: function() {

                    // in the `selectedSquares` array each element represents a square on the board,
                    // and is populated with the numerical value of drag item if present
                    var selectedSquares = [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    // `complete` is true if all the `drop` items contain a `drag` item
                        complete = false,
                    // 'total` is the sum of the values in each `drop` item
                        total = _.reduce(_selectedItems, function(sum, item) {
                            return sum + (item && item.hasOwnProperty('title') ? Number(item.title) : 0);
                        }, 0),

                    // `selected` is the total number of `drop` items which have been populated with a `drag` item
                        selected = _.reduce(_selectedItems, function(sum, item) {
                            return sum + (item && item.hasOwnProperty('title') ? 1 : 0);
                        }, 0);

                    // add the numerical value to the corresponding index in the `selectedSquares` array from the current `selectedItems`
                    _.forEach(this.selectedItems(), function(item, key) {
                        selectedSquares[key] = (item && item.hasOwnProperty('title') ? Number(item.title) : 0);
                    });

                    if (total === _grandTotal) {
                        complete = true;
                    }

                    // evaluate each row, column and diagonal in turn
                    _row1 = selectedSquares[0] + selectedSquares[1] + selectedSquares[2],
                        _row2 = selectedSquares[3] + selectedSquares[4] + selectedSquares[5],
                        _row3 = selectedSquares[6] + selectedSquares[7] + selectedSquares[8],

                        _column1 = selectedSquares[0] + selectedSquares[3] + selectedSquares[6],
                        _column2 = selectedSquares[1] + selectedSquares[4] + selectedSquares[7],
                        _column3 = selectedSquares[2] + selectedSquares[5] + selectedSquares[8],

                        _diagonal1 = selectedSquares[0] + selectedSquares[4] + selectedSquares[8],
                        _diagonal2 = selectedSquares[2] + selectedSquares[4] + selectedSquares[6];

                    var row1Correct = (_row1 === this.magicNumber()),
                        row2Correct = (_row2 === this.magicNumber()),
                        row3Correct = (_row3 === this.magicNumber()),

                        column1Correct = (_column1 === this.magicNumber()),
                        column2Correct = (_column2 === this.magicNumber()),
                        column3Correct = (_column3 === this.magicNumber()),

                        diagonal1Correct = (_diagonal1 === this.magicNumber()),
                        diagonal2Correct = (_diagonal2 === this.magicNumber()),

                        rowsCorrect = row1Correct && row2Correct && row3Correct,
                        columnsCorrect = column1Correct && column2Correct && column3Correct,
                        diagonalsCorrect = diagonal1Correct && diagonal2Correct,

                        _allCorrect = rowsCorrect && columnsCorrect && diagonalsCorrect;

                    _gameValues = {
                        correct: _allCorrect,
                        squares: selectedSquares,
                        selected: selected,
                        complete: complete
                    };
                }
            };
        // trigger the watch internally
        game.watchSelectedItems();

        // sets the initial values for the `drag` and `drop` items
        game.init();

        return game;
    }]);
}());
