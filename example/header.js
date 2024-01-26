<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<html lang="en">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=$charset">
    <title>@pagetitle@</title>
    <link rel="stylesheet" type="text/css" href="@basedir@gcov.css">

    <link rel="stylesheet" type="text/css" href="gcov.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script type="text/javascript">

    function getColumnWithName(table, name)
    {
       var foundColumn = null;

        // Iterate over each table
        $('table').each(function() {
            var table = $(this);

            // Check each header cell in the first row
            table.find('th, td').each(function() {
                if ($(this).text().trim() === name) {
                    foundColumn = $(this);
                    return false;
                }
            });

            if (foundColumn) {
                return false;
            }
        });

        return foundColumn; // This will be null if no table is found
    }

    function findTableWithColumnName(name) {
        var foundTable = null;

        // Iterate over each table
        $('table').each(function() {
            var table = $(this);

            // Check each header cell in the first row
            table.find('th, td').each(function() {
                if ($(this).text().trim() === name) {
                    foundTable = table;
                    return false;
                }
            });

            if (foundTable) {
                return false;
            }
        });

        return foundTable; // This will be null if no table is found
    }

    function scanTable($table) {
        var matrix = [];
        $table.children("tr").each(function(y, row) {
            $(row).children("td, th").each(function(x, cell) {
                var $cell = $(cell),
                    cspan = parseInt($cell.attr("colspan"), 10) || 1,
                    rspan = parseInt($cell.attr("rowspan"), 10) || 1;

                for (; matrix[y] && matrix[y][x]; x++); // Skip already occupied cells in current row

                for (var tx = x; tx < x + cspan; tx++) { // Mark matrix elements occupied by current cell
                    for (var ty = y; ty < y + rspan; ty++) {
                        if (!matrix[ty]) { // Fill missing rows
                            matrix[ty] = [];
                        }
                        matrix[ty][tx] = true;
                    }
                }

                var pos = {
                    top: y,
                    left: x
                };
                $cell.data("cellPos", pos);
            });
        });
    }

    function getColumnPosByText($table, text) {
        if (!$table || $table.length === 0) {
            console.error("Invalid table object");
            return [];
        }

        // Find the header cell with the given text and get its absolute column index
        var positions = [];
        $table.find('th, td').each(function() {
            if ($(this).text().trim() === text) {
                positions.push($(this).cellPos());
            }
        });

        return positions;
    }

    function getFilesTable() {
        var table = findTableWithColumnName("Directory");
        if (table) {
            return table;
        }

        return findTableWithColumnName("File");
    }

    function findColumnCells($table, index) {
        var cells = [];
        $table.find('tr').each(function() {
            $(this).find('td').each(function() {
                var cellPos = $(this).cellPos();
                if (cellPos.left === index) {
                    cells.push($(this));
                }
            });
        });
        return cells;
    }

    function findColumnHeaders($table, index) {
        var cells = [];
        $table.find('tr').each(function() {
            $(this).find('td').each(function() {
                var cellPos = $(this).cellPos();
                var colspan = parseInt($(this).attr('colspan'));

                if (colspan > 1) {
                    if (cellPos.left <= index && index < cellPos.left + colspan) {
                        cells.push($(this));
                    }
                }
            });
        });
        return cells;
    }

    function toggleColumnByIndex($table, index, isVisible) {
        var cells = findColumnCells($table, index);
        cells.forEach(function($cell) {
            if (isVisible) {
                $cell.show();
            } else {
                $cell.hide();
            }
        });
    }


    function toggleColumnByHeaderText($table, text, isVisible) {
        var positions = getColumnPosByText($table, text)
        if (positions == []) {
            console.log("Column not found");
            return [];
        }

        positions.forEach(function(pos) {
            toggleColumnByIndex($table, pos.left, isVisible)
        });

        return positions;
    }

    function getVisibleRowCells($row, column_positions) {
        var values = [];
        $row.find('td').each(function() {
            var cellPos = $(this).cellPos();

            if ($(this).css('display') == 'none') {
                return;
            }

            var matches = column_positions.some(function(pos) {
                return cellPos.left === pos.left;
            });

            if (matches) {
                values.push($(this));
            }
        });

        return values;
    }

    function isRowEmpty($row, column_positions) {
        var sum = 0;
        getVisibleRowCells($row, column_positions).forEach(function(elem) {
            var cellText = elem.text().trim();
            if (cellText == "") {
                return;
            }

            var number = parseFloat(cellText);
            if (!isNaN(number)) {
                sum += number;
            }
        });

        return sum == 0;
    }

    function toggleClass(className, turnOn) {
        var disabledClassNname = className + "_disabled";
        if (turnOn) {
            document.querySelectorAll('.' + disabledClassNname).forEach(function(el) {
                el.classList.remove(disabledClassNname);
                el.classList.add(className);
            });
        } else {
            document.querySelectorAll('.' + className).forEach(function(el) {
                el.classList.remove(className);
                el.classList.add(disabledClassNname);
            });
        }
    }

    function toggleVisibility(className, disabledClassNname, turnOn) {
        if (turnOn) {
            document.querySelectorAll(disabledClassNname).forEach(function(el) {
                el.style.visibility = 'visible';
            });
        } else {
            document.querySelectorAll(className).forEach(function(el) {
                el.style.visibility = 'hidden';
            });
        }
    }

    function getNewClassName(className, isOn){
        return isOn ? className + "_disabled" : className;
    }

$(document).ready(function() {

    /* plugin */
    $.fn.cellPos = function(rescan) {
        var $cell = this.first(),
            pos = $cell.data("cellPos");
        if (!pos || rescan) {
            var $table = $cell.closest("table, thead, tbody, tfoot");
            scanTable($table);
        }
        pos = $cell.data("cellPos");
        return pos;
    }

    COVERAGE_TABLE = getFilesTable();
    CATEGORIES = ["UNC", "LBC", "UIC", "UBC", "GBC", "GIC", "GNC", "CBC", "EUB", "ECB", "DUB", "DCB"];
    HEADERS_CLASSES = CATEGORIES.map(tla => 'td.headerCovTableHead' + tla).join(', ');

    var COLUMN_POSITIONS = COVERAGE_TABLE ? CATEGORIES.map(function(category) {
      return getColumnPosByText(COVERAGE_TABLE, category);
    }).flat() : [];


    var COLUMN_HEADER_MAP = {};
    COLUMN_POSITIONS.forEach(function(columnPosition) {
        var headers = findColumnHeaders(COVERAGE_TABLE, columnPosition.left);
        COLUMN_HEADER_MAP[columnPosition.left] = headers;
    });


    // Function to update the appearance based on the state
    function updateAppearance(button, isActive) {

      columnIndex = button.index();

        if (isActive) {
              button.css({
                'cursor': 'pointer',
                'border': '1px solid #ccc',
                'border-radius': '5px',
                'background-color': '#f0f0f0',
                'padding': '5px 10px',
                'text-align': 'center',
                'color': ''
            });

            button.closest('table').find('tr').each(function() {
                $(this).find('td').eq(columnIndex).css('background-color', '');
            });

        } else {
              button.css({
                'background-color': 'gray',
                'color': 'white',
                'cursor': 'pointer',
                'border': '1px solid #ccc',
                'border-radius': '5px',
                'padding': '5px 10px',
                'text-align': 'center'
            });

            button.closest('table').find('tr').each(function() {
                $(this).find('td').eq(columnIndex).css('background-color', 'gray');
            });
        }
    }

    function isButtonOn(buttonName) {
        var stateKey = 'buttonState_' + buttonName;
        var savedState = localStorage.getItem(stateKey);
        return savedState !== 'false';
    }

    function toggleButtonState(element, buttonName) {
        var isChecked = isButtonOn(buttonName);
        var stateKey = 'buttonState_' + buttonName;

        if (isChecked) {
            // When the button is off, save the state as 'false' in localStorage
            localStorage.setItem(stateKey, 'false');
        } else {
            // When the button is on, remove its state from localStorage
            localStorage.removeItem(stateKey);
        }

        updateAppearance(element, !isChecked);
        return !isChecked;
    }

    /*
      COVERAGE_TABLE.find("td").each(function(){
        txt = $(this).text();
        var colspan = parseInt($(this).attr('colspan')) || 1;
        $(this).text(txt + " " + $(this).cellPos().top +","+ $(this).cellPos().left + " " + colspan);
      });
      */

    function toggleColumn(table, category, isChecked) {
        positions = toggleColumnByHeaderText(table, category, isChecked);
        positions.forEach(function(pos) {
          COLUMN_HEADER_MAP[pos.left].forEach(function(elem) {
              var colspan = parseInt(elem.attr('colspan'));
              if (isChecked) {
                elem.attr('colspan', colspan + 1);
              } else {
                elem.attr('colspan', colspan - 1);
              }
          })
        });
    }

    function toggleRows(table) {
        table.find('tr').each(function() {
            var fileDirClases = ['coverFile', 'coverDirectory'];
            var $currentRow = $(this);
            var isFileOrDirEntry = fileDirClases.some(function(className) {
                return $currentRow.find('td:first').hasClass(className);
            });

            if (!isFileOrDirEntry) {
                return;
            }

            if (isRowEmpty($(this), COLUMN_POSITIONS)) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });
    }

    // headers = $(HEADERS_CLASSES).add(getColumnWithName(COVERAGE_TABLE, "Line Coverage").get());
    $(HEADERS_CLASSES).each(function() {
        var buttonName = $(this).text().trim();
        var isChecked = isButtonOn(buttonName);
        updateAppearance($(this), isChecked);

        if (!isChecked) {
            if (COVERAGE_TABLE) {
                toggleColumn(COVERAGE_TABLE, buttonName, isChecked);
                toggleRows(COVERAGE_TABLE);
            } else {
                toggleVisibility(
                    "a.tlaBg" + buttonName,
                    "a.tlaBg" + buttonName + "_disabled",
                    false
                    );

                toggleVisibility(
                    'span.tla' + buttonName + ' a.branchTla',
                    'span.tla' + buttonName + "_disabled" +' a.branchTla',
                    false
                    );

                toggleClass("tlaBg" + buttonName, false);
                toggleClass("tla" + buttonName, false);
            }
        }
    }).on('click', function() {
        var buttonName = $(this).text().trim();
        isOn = toggleButtonState($(this), buttonName);

        if (COVERAGE_TABLE) {
            toggleColumn(COVERAGE_TABLE, buttonName, isOn);
            toggleRows(COVERAGE_TABLE);
        } else {
            toggleVisibility(
                "a.tlaBg" + buttonName,
                "a.tlaBg" + buttonName + "_disabled",
                isOn
                );

            toggleVisibility(
                'span.tla' + buttonName + ' a.branchTla',
                'span.tla' + buttonName + "_disabled" +' a.branchTla',
                isOn
                );

            toggleClass("tlaBg" + buttonName, isOn);
            toggleClass("tla" + buttonName, isOn);
        }
    });
});

    </script>
</head>

<body>
