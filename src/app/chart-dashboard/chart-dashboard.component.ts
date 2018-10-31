import { Component, OnInit, Input, NgZone } from '@angular/core';
import {CompactType, DisplayGrid, GridsterConfig, GridsterItem, GridType} from 'angular-gridster2';

import { Universe, Chart, Filter, Data, Query } from '../data.models';
import { DataService } from '../data.service';

@Component({
  selector: 'app-chart-dashboard',
  templateUrl: './chart-dashboard.component.html',
  styleUrls: ['./chart-dashboard.component.scss']
})
export class ChartDashboardComponent implements OnInit {

  @Input() charts: Chart[] = [];
  @Input() filters: Filter[] = [];
  options: GridsterConfig;
  dashboard: Array<GridsterItem>;

  constructor(private ngZone: NgZone, private dataService: DataService) { }

  ngOnInit() {
    this.options = {
      gridType: GridType.Fixed,
      compactType: CompactType.CompactUpAndLeft,
      margin: 10,
      outerMargin: true,
      outerMarginTop: null,
      outerMarginRight: null,
      outerMarginBottom: null,
      outerMarginLeft: null,
      mobileBreakpoint: 640,
      minCols: 1,
      maxCols: 100000,
      minRows: 1,
      maxRows: 100000,
      maxItemCols: 100,
      minItemCols: 1,
      maxItemRows: 100,
      minItemRows: 1,
      maxItemArea: 2500,
      minItemArea: 1,
      defaultItemCols: 1,
      defaultItemRows: 1,
      fixedColWidth: 10,
      fixedRowHeight: 10,
      keepFixedHeightInMobile: false,
      keepFixedWidthInMobile: false,
      scrollSensitivity: 10,
      scrollSpeed: 20,
      enableEmptyCellClick: false,
      enableEmptyCellContextMenu: false,
      enableEmptyCellDrop: false,
      enableEmptyCellDrag: false,
      emptyCellDragMaxCols: 50,
      emptyCellDragMaxRows: 50,
      ignoreMarginInRow: false,
      draggable: {
        enabled: true,
      },
      resizable: {
        enabled: true,
      },
      swap: true,
      pushItems: true,
      disablePushOnDrag: false,
      disablePushOnResize: false,
      pushDirections: {north: true, east: true, south: true, west: true},
      pushResizeItems: false,
      displayGrid: DisplayGrid.Always,
      disableWindowResize: false,
      disableWarnings: false,
      scrollToNewItems: false,
      itemResizeCallback: this.resize.bind(this)
    };
  }

  resize(gridsterItem,gridsterItemComponent){
    this.charts[gridsterItem.index]['view'] = [gridsterItemComponent.width , gridsterItemComponent.height];
    this.charts[gridsterItem.index]['update'] = Date.now();
  }

  itemChange(item, itemComponent) {
    console.info('itemChanged', item, itemComponent);
  }

  itemResize(item, itemComponent) {
    console.info('itemResized', item, itemComponent);
  }


  onClear(_filter?: Filter): Promise<void> {
    const filters = _filter ? [_filter] : this.filters;
    filters.forEach(filter => {
      switch (filter.type) {
        case 'value':
          filter.range = [filter.minValue, filter.maxValue];
          break;
        default:
          filter.range = filter.query.column.values;
          filter.rangeIndex = filter.range.reduce((acc, cur) => {
            acc[cur] = true;
            return acc;
          }, {});
      }
    });
    return this.updateFilters();
  }

  onSelect(): Promise<void> {
    return this.updateFilters();
  }

  onOnly(filter: Filter, id: string) {
    filter.rangeIndex = {
      [id]: true
    };
    this.updateFilters();
  }

  /** Updates universe/crossfilter filters based on UI filters */
  async updateFilters(): Promise<void> {
    const p = this.filters.map(filter => {
      switch (filter.type) {
        case 'value':
          const value = {
            $gte: filter.range[0],
            $lte: filter.range[1],
          };
          return this.dataService.dataUniverse.filter(filter.key, value, true, true);
        default:
          const range = Object.keys(filter.rangeIndex).reduce((acc, key) => {
            if (filter.rangeIndex[key]) {
              acc.push(parseInt(key, 10) || key);
            }
            return acc;
          }, []);
          return this.dataService.dataUniverse.filter(filter.key, range, false, true);
      }
    });

    await Promise.all(p);
    return this.updateData();
  }

  /** Converts universe aggragate data into ngx-charts data */
  private updateData(): void {
    this.ngZone.runOutsideAngular(() => {
      this.charts.forEach(chart => {
        chart.data = this.dataService.getChartSeriesFromQuery(chart.xQuery, chart.dataDims[2], chart.dataDims[4]);

        // todo: move to dataService
        const filter = chart.xFilter;
        if (filter.type === 'cat' && filter.values.length > 0) {
          chart.activeEntries = chart.data.filter(d => {
            return filter.rangeIndex[d.name];
          });
        } else if (filter.type === 'value') {
          chart.activeEntries = chart.data.filter(d => {
            return (d.name >= filter.minValue && d.name <= filter.maxValue);
          });
        } else {
          chart.activeEntries = [];
        }
      });
    });
    this.ngZone.run(() => { });
  }
}
