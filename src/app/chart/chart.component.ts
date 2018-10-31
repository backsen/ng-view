import { Component, OnInit, Input, EventEmitter, Output, HostBinding, ViewEncapsulation , ViewChild} from '@angular/core';
import * as SvgSaver from 'svgsaver';

import { Universe, Chart, Filter, Data, Query } from '../data.models';

const EMPTY = [];

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ChartComponent implements OnInit {

  // chartsNames: Array<string> = [
  //   'ngxChartsBarVertical' , 'ngxChartsBarHorizontal' , 'ngxChartsPieChart',
  //   'ngxChartsPieGrid' , 'ngxChartsTreeMap' , 'ngxChartsNumberCard',
  //   'ngxChartsGauge' , 'ngxChartsBarVertical2d' , 'ngxChartsBarHorizontal2d',
  //   'ngxChartsBarVerticalStacked' , ''
  // ];

  @ViewChild('ngxChartsBarVertical') ngxChartsBarVertical;
  @ViewChild('ngxChartsBarHorizontal') ngxChartsBarHorizontal;

  @Output() select: EventEmitter<{chart: Chart, value?: any}> = new EventEmitter();

  @Input() chart: Chart;
  @Input() chartType: any;
  @Input() data: Data[];

  @Input() set update(value){
    console.log(456);
    if(this.ngxChartsBarVertical){
      // this.ngxChartsBarVertical.update();
    }
  }


  svgSaver = new SvgSaver();

  @Input() set activeEntries(value: Data[]) {
    this._activeEntries = value;
  }

  get activeEntries(): Data[] {
    return this.hasActiveEntries ? this._activeEntries : EMPTY;
  }

  private _activeEntries: Data[];

  @HostBinding('class.has-active-entries')
  get hasActiveEntries() {
    return this._activeEntries && this._activeEntries.length > 0;
  }

  constructor() {
    
   }

  ngAfterViewInit(){

  }

  ngOnInit() {
    console.log(this.chart);
  }

  onSelect(data: Data) {
    if (data) {
      const value = typeof data === 'object' ? data.name : data;
      if (this.chart.xFilter) {
        const filter = this.chart.xFilter;
        switch (filter.type) {
          case 'value':
            filter.range[0] = value;
            break;
          default:
            filter.rangeIndex[value] = !filter.rangeIndex[value];
        }
      }
      return this.select.emit({chart: this.chart, value});
    }
    return this.select.emit({chart: this.chart});
  }
}
