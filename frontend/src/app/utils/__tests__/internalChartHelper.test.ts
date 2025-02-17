/**
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ChartDataSectionType, DataViewFieldType } from 'app/constants';
import { ChartDataSectionField, ChartStyleConfig } from 'app/types/ChartConfig';
import { ChartStyleConfigDTO } from 'app/types/ChartConfigDTO';
import {
  diffHeaderRows,
  flattenHeaderRowsWithoutGroupRow,
  getColumnRenderOriginName,
  isInRange,
  isUnderUpperBound,
  mergeChartDataConfigs,
  mergeChartStyleConfigs,
  reachLowerBoundCount,
  transferChartConfigs,
  transformHierarchyMeta,
  transformMeta,
} from '../internalChartHelper';

describe('Internal Chart Helper ', () => {
  describe.each([
    [0, 0, true],
    [0, 1, false],
    [1, 1, true],
    [0, null, true],
    [1, null, true],
    [0, undefined, true],
    [1, undefined, true],
    [1, '[1, 999]', true],
    [0, '[1, 999]', true],
    [0, [1, 999], false],
    [1, [1, 999], true],
    [999, [1, 999], true],
    [1000, [1, 999], false],
    [1, '1', true],
    [0, '1', false],
    [1, ['1', '999'], true],
    [0, ['1', '999'], false],
  ])('isInRange Test - ', (count, limit, ifInRange) => {
    test(`length ${count} in ${limit} limit is ${ifInRange}`, () => {
      expect(isInRange(limit, count)).toBe(ifInRange);
    });
  });

  describe.each([
    [0, 0, true],
    [0, 1, true],
    [1, 1, true],
    [0, null, true],
    [1, null, true],
    [0, undefined, true],
    [1, undefined, true],
    [1, '[1, 999]', true],
    [0, '[1, 999]', true],
    [0, [1, 999], true],
    [1, [1, 999], true],
    [999, [1, 999], true],
    [1000, [1, 999], false],
    [1, '1', true],
    [0, '1', true],
    [1, ['1', '999'], true],
    [0, ['1', '999'], true],
  ])('isUnderUpperBound Test - ', (count, limit, ifInRange) => {
    test(`length ${count} in ${limit} limit under uppper bound is ${ifInRange}`, () => {
      expect(isUnderUpperBound(limit, count)).toBe(ifInRange);
    });
  });

  describe.each([
    [0, 0, 0],
    [0, 1, 1],
    [1, 1, 0],
    [0, null, 0],
    [1, null, 0],
    [0, undefined, 0],
    [1, undefined, 0],
    [1, '[1, 999]', 0],
    [0, '[1, 999]', 0],
    [0, [1, 999], 1],
    [1, [1, 999], 0],
    [999, [1, 999], -998],
    [1000, [1, 999], -999],
    [1, '1', 0],
    [0, '1', 1],
    [1, ['1', '999'], 0],
    [0, ['1', '999'], 1],
  ])('reachLowerBoundCount Test - ', (count, limit, distance) => {
    test(`length ${count} reach ${limit} limit is ${distance}`, () => {
      expect(reachLowerBoundCount(limit, count)).toBe(distance);
    });
  });

  describe.each([
    [[{}], [{}], [{}]],
    [[{}], [null], [{}]],
    [[{}], [undefined], [{}]],
    [[{ a: 1 }], [{ a: 2 }], [{ a: 1 }]],
    [[{ value: 1 }], [{ value: 2 }], [{ value: 2 }]],
    [[{ value: 1 }], [{ value: 2, b: 1 }], [{ value: 2 }]],
    [[{ value: 1 }], [{ value: 2, b: 1 }, { value: 3 }], [{ value: 2 }]],
    [
      [{ value: 1, default: 'no change' }],
      [{ value: 2, default: 2 }],
      [{ value: 2, default: 'no change' }],
    ],
    [
      [{ value: 1 }, { value: 1 }],
      [{ value: 2, b: 1 }],
      [{ value: 2 }, { value: 1 }],
    ],
    [
      [{ value: 1 }, { value: 1 }],
      [{ value: 2 }, { value: 2, b: 1 }],
      [{ value: 2 }, { value: 2 }],
    ],
    [
      [{ value: 1, rows: [{ value: 1 }] }],
      [{ value: 2 }, { value: 3, rows: [{ value: 3 }] }],
      [{ value: 2, rows: [{ value: 1 }] }],
    ],
    [
      [{ value: 1, rows: [{ value: 1 }] }],
      [
        { value: 2, rows: [{ value: 2, b: 2 }] },
        { value: 3, rows: [{ value: 3 }] },
      ],
      [{ value: 2, rows: [{ value: 2 }] }],
    ],
    [
      [{ value: 1, rows: null }],
      [
        { value: 2, rows: [{ value: 2, b: 2 }] },
        { value: 3, rows: [{ value: 3 }] },
      ],
      [{ value: 2, rows: [{ value: 2, b: 2 }] }],
    ],
    [
      [{ value: 1, rows: [] }],
      [
        { value: 2, rows: [{ value: 2, b: 2, c: 2, d: 2 }] },
        { value: 3, rows: [{ value: 3 }] },
      ],
      [{ value: 2, rows: [{ value: 2, b: 2, c: 2, d: 2 }] }],
    ],
    [
      [{ key: 'a', value: 1 }],
      [{ key: 'a', value: 2 }],
      [{ key: 'a', value: 2 }],
    ],
    [
      [{ key: 'a', value: 1 }],
      [{ key: 'b', value: 2 }],
      [{ key: 'a', value: 1 }],
    ],
    [
      [{ key: 'a', value: 1 }],
      [
        { key: 'b', value: 2 },
        { key: 'a', value: 3 },
      ],
      [{ key: 'a', value: 3 }],
    ],
    [
      [{ key: 'a', value: 1 }],
      [{ value: 2 }, { value: 3 }],
      [{ key: 'a', value: 1 }],
    ],
    [
      [{ key: 'a', value: 1, rows: [{ key: 'aa', value: 1 }] }],
      [
        { key: 'a', value: 2, rows: [{ key: 'aa', value: 2 }] },
        { value: 3, rows: [{ key: 'aa', value: 3 }] },
      ],
      [{ key: 'a', value: 2, rows: [{ key: 'aa', value: 2 }] }],
    ],
    [
      [{ key: 'a', value: 1, rows: [{ key: 'aa', value: 1 }] }],
      [
        { key: 'b', value: 2, rows: [{ key: 'aa', value: 2 }] },
        { key: 'a', value: 3, rows: [{ key: 'aa', value: 3 }] },
      ],
      [{ key: 'a', value: 3, rows: [{ key: 'aa', value: 3 }] }],
    ],
    [
      [
        {
          key: 'a',
          value: 1,
          rows: [{ key: 'aa', value: 1, rows: [{ key: 'aaa', value: 1 }] }],
        },
      ],
      [
        { key: 'b', value: 2, rows: [{ key: 'aa', value: 2 }] },
        {
          key: 'a',
          value: 3,
          rows: [{ key: 'aa', value: 3, rows: [{ key: 'aaa', value: 3 }] }],
        },
      ],
      [
        {
          key: 'a',
          value: 3,
          rows: [{ key: 'aa', value: 3, rows: [{ key: 'aaa', value: 3 }] }],
        },
      ],
    ],
    [
      [{ key: 'a', value: null, default: 0 }],
      [],
      [{ key: 'a', value: null, default: 0 }],
      { useDefault: true },
    ],
    [
      [{ key: 'a', value: undefined, default: 0 }],
      [],
      [{ key: 'a', value: 0, default: 0 }],
      { useDefault: true },
    ],
    [
      [{ key: 'a', value: null, default: 0 }],
      [
        { key: 'b', value: 2, default: 'n' },
        { key: 'a', value: 3, default: 'm' },
      ],
      [{ key: 'a', value: 3, default: 0 }],
      { useDefault: true },
    ],
    [
      [
        {
          key: 'a',
          value: undefined,
          default: 0,
          rows: [{ value: undefined, default: 0 }],
        },
      ],
      [],
      [{ key: 'a', value: 0, default: 0, rows: [{ value: 0, default: 0 }] }],
      { useDefault: true },
    ],
    [
      [{ key: 'a', value: undefined, default: 0 }],
      [],
      [{ key: 'a', value: undefined, default: 0 }],
      { useDefault: false },
    ],
    [
      [
        {
          key: 'a',
          value: undefined,
          default: 0,
          rows: [{ value: undefined, default: 0 }],
        },
      ],
      [],
      [
        {
          key: 'a',
          value: undefined,
          default: 0,
          rows: [{ value: undefined, default: 0 }],
        },
      ],
      { useDefault: false },
    ],
  ])('mergeChartStyleConfigs Test - ', (target, source, expected, options?) => {
    test(`deep merge target: ${JSON.stringify(
      target,
    )} from source: ${JSON.stringify(source)} result is ${JSON.stringify(
      expected,
    )} - options ${options ? JSON.stringify(options) : ''}`, () => {
      const result = mergeChartStyleConfigs(
        target as ChartStyleConfig[],
        source as ChartStyleConfigDTO[],
        options,
      );
      expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
    });
  });

  describe.each([
    [
      [{ key: 'a', type: 't1', rows: [] }],
      [
        {
          key: 'a',
          type: 't2',
          rows: [{ colName: 'aa', type: 'STRING', category: 'field' }],
        },
      ],
      [
        {
          key: 'a',
          type: 't1',
          rows: [{ colName: 'aa', type: 'STRING', category: 'field' }],
        },
      ],
    ],
    [
      [{ key: 'a', type: 't1', rows: [] }],
      [
        {
          key: 'b',
          type: 't2',
          rows: [{ colName: 'aa', type: 'STRING', category: 'field' }],
        },
      ],
      [
        {
          key: 'a',
          type: 't1',
          rows: [],
        },
      ],
    ],
    [
      [{ key: 'a', rows: [] }],
      [],
      [
        {
          key: 'a',
          rows: [],
        },
      ],
    ],
  ])('mergeChartDataConfigs Test - ', (target, source, expected, options?) => {
    test(`deep merge target: ${JSON.stringify(
      target,
    )} from source: ${JSON.stringify(source)} result is ${JSON.stringify(
      expected,
    )} - options ${options ? JSON.stringify(options) : ''}`, () => {
      const result = mergeChartDataConfigs(target, source as any);
      expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
    });
  });

  describe('transferChartConfigs Test', () => {
    test('should not transfer data when source config is empty', () => {
      const targetConfig = { datas: [], styles: [] };
      const sourceConfig = undefined;
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result).toEqual(targetConfig);
    });

    test('should not transfer data when target config is empty', () => {
      const targetConfig = undefined;
      const sourceConfig = { datas: [], styles: [] };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result).toEqual(sourceConfig);
    });

    test('should transfer data configs when section type is group', () => {
      const targetConfig = {
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            rows: [],
          },
        ],
      };
      const sourceConfig = {
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            rows: [
              {
                colName: 'label',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result).toEqual(targetConfig);
      expect(result).toEqual(sourceConfig);
    });

    test('should transfer data configs when section type is group and target max row limitation is less then target rows', () => {
      const targetConfig = {
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            limit: 1,
            rows: [],
          },
        ],
      };
      const sourceConfig = {
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            rows: [
              {
                colName: 'label',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                colName: 'label2',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result?.datas?.[0]?.rows).toEqual([
        {
          colName: 'label',
          type: DataViewFieldType.STRING,
          category: 'field' as any,
        },
      ]);
    });

    test('should transfer data configs when section type is group and with multi target limitation', () => {
      const targetConfig = {
        datas: [
          {
            key: 'group1',
            type: ChartDataSectionType.GROUP,
            limit: [0, 1],
            rows: [],
          },
          {
            key: 'group2',
            type: ChartDataSectionType.GROUP,
            limit: [1, 2],
            rows: [],
          },
        ],
      };
      const sourceConfig = {
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            rows: [
              {
                colName: 'label1',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                colName: 'label2',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                colName: 'label3',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                colName: 'label4',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                colName: 'label5',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result?.datas?.[0]?.key).toEqual('group1');
      expect(result?.datas?.[0]?.rows).toEqual([
        {
          colName: 'label2',
          type: DataViewFieldType.STRING,
          category: 'field' as any,
        },
      ]);
      expect(result?.datas?.[1]?.key).toEqual('group2');
      expect(result?.datas?.[1]?.rows).toEqual([
        {
          colName: 'label1',
          type: DataViewFieldType.STRING,
          category: 'field' as any,
        },
        {
          colName: 'label3',
          type: DataViewFieldType.STRING,
          category: 'field' as any,
        },
      ]);
    });

    test('should transfer data configs when section type is aggregate, color, info, size, filter, mixed', () => {
      const targetConfig = {
        datas: [
          {
            key: 'aggregate',
            type: ChartDataSectionType.AGGREGATE,
            rows: [],
          },
          {
            key: 'color',
            type: ChartDataSectionType.COLOR,
            rows: [],
          },
          {
            key: 'info',
            type: ChartDataSectionType.INFO,
            rows: [],
          },
          {
            key: 'size',
            type: ChartDataSectionType.SIZE,
            rows: [],
          },
          {
            key: 'filter',
            type: ChartDataSectionType.FILTER,
            rows: [],
          },
          {
            key: 'mixed',
            type: ChartDataSectionType.MIXED,
            rows: [],
          },
        ],
      };
      const sourceConfig = {
        datas: [
          {
            key: 'aggregate',
            type: ChartDataSectionType.AGGREGATE,
            rows: [
              {
                colName: 'label1',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'color',
            type: ChartDataSectionType.COLOR,
            rows: [
              {
                colName: 'label2',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'info',
            type: ChartDataSectionType.INFO,
            rows: [
              {
                colName: 'label3',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'size',
            type: ChartDataSectionType.SIZE,
            rows: [
              {
                colName: 'label4',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'filter',
            type: ChartDataSectionType.FILTER,
            rows: [
              {
                colName: 'label5',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'mixed',
            type: ChartDataSectionType.MIXED,
            rows: [
              {
                colName: 'label6',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result).toEqual(sourceConfig);
    });

    test('should transfer data configs when section from mixed type to non mixed types', () => {
      const targetConfig = {
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            limit: [0, 2],
            rows: [],
          },
          {
            key: 'aggregate',
            type: ChartDataSectionType.AGGREGATE,
            limit: [0, 1],
            rows: [],
          },
        ],
      };
      const sourceConfig = {
        datas: [
          {
            key: 'mixed',
            type: ChartDataSectionType.MIXED,
            rows: [
              {
                colName: 'label1',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                colName: 'label2',
                type: DataViewFieldType.DATE,
                category: 'field' as any,
              },
              {
                colName: 'label3',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
              {
                colName: 'label4',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
              {
                colName: 'label5',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result).toEqual({
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            limit: [0, 2],
            rows: [
              {
                colName: 'label1',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                colName: 'label2',
                type: DataViewFieldType.DATE,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'aggregate',
            type: ChartDataSectionType.AGGREGATE,
            limit: [0, 1],
            rows: [
              {
                colName: 'label3',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
        ],
      });
    });

    test('should transfer data configs when section from non mixed type to mixed types and target config only mixed type', () => {
      const targetConfig = {
        datas: [
          {
            key: 'mixed',
            type: ChartDataSectionType.MIXED,
            limit: [0, 3],
            rows: [],
          },
        ],
      };
      const sourceConfig = {
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            rows: [
              {
                colName: 'label1',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                colName: 'label2',
                type: DataViewFieldType.DATE,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'aggregate',
            type: ChartDataSectionType.AGGREGATE,
            rows: [
              {
                colName: 'label3',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
              {
                colName: 'label4',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result).toEqual({
        datas: [
          {
            key: 'mixed',
            type: ChartDataSectionType.MIXED,
            limit: [0, 3],
            rows: [
              {
                colName: 'label1',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                colName: 'label2',
                type: DataViewFieldType.DATE,
                category: 'field' as any,
              },
              {
                colName: 'label3',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
        ],
      });
    });

    test('should transfer data configs when section from non mixed type to mixed types and target config with multi-mixed type', () => {
      const targetConfig = {
        datas: [
          {
            key: 'mixed1',
            type: ChartDataSectionType.MIXED,
            limit: 1,
            rows: [],
          },
          {
            key: 'mixed2',
            type: ChartDataSectionType.MIXED,
            limit: [0, 2],
            rows: [],
          },
        ],
      };
      const sourceConfig = {
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            rows: [
              {
                colName: 'label1',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                colName: 'label2',
                type: DataViewFieldType.DATE,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'aggregate',
            type: ChartDataSectionType.AGGREGATE,
            rows: [
              {
                colName: 'label3',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
              {
                colName: 'label4',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result).toEqual({
        datas: [
          {
            key: 'mixed1',
            type: ChartDataSectionType.MIXED,
            limit: 1,
            rows: [
              {
                colName: 'label1',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'mixed2',
            type: ChartDataSectionType.MIXED,
            limit: [0, 2],
            rows: [
              {
                colName: 'label2',
                type: DataViewFieldType.DATE,
                category: 'field' as any,
              },
              {
                colName: 'label3',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
        ],
      });
    });

    test('should transfer data configs when section from non mixed type to mixed types and target config with other section type', () => {
      const targetConfig = {
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            limit: [0, 1],
            rows: [],
          },
          {
            key: 'aggregate',
            type: ChartDataSectionType.AGGREGATE,
            limit: 1,
            rows: [],
          },
          {
            key: 'mixed',
            type: ChartDataSectionType.MIXED,
            limit: [0, 3],
            rows: [],
          },
        ],
      };
      const sourceConfig = {
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            limit: [1, 2],
            rows: [
              {
                uid: '1',
                colName: 'label1',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
              {
                uid: '2',
                colName: 'label2',
                type: DataViewFieldType.DATE,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'aggregate',
            type: ChartDataSectionType.AGGREGATE,
            rows: [
              {
                uid: '3',
                colName: 'label3',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
              {
                uid: '4',
                colName: 'label4',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);

      expect(result).toEqual({
        datas: [
          {
            key: 'group',
            type: ChartDataSectionType.GROUP,
            limit: [0, 1],
            rows: [
              {
                uid: '1',
                colName: 'label1',
                type: DataViewFieldType.STRING,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'aggregate',
            type: ChartDataSectionType.AGGREGATE,
            limit: 1,
            rows: [
              {
                uid: '3',
                colName: 'label3',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
          {
            key: 'mixed',
            type: ChartDataSectionType.MIXED,
            limit: [0, 3],
            rows: [
              {
                uid: '2',
                colName: 'label2',
                type: DataViewFieldType.DATE,
                category: 'field' as any,
              },
              {
                uid: '4',
                colName: 'label4',
                type: DataViewFieldType.NUMERIC,
                category: 'field' as any,
              },
            ],
          },
        ],
      });
    });

    test('should transfer style configs', () => {
      const targetConfig = {
        styles: [
          {
            label: 'stack.title',
            key: 'stack',
            comType: 'group',
            rows: [
              {
                label: 'stack.enable',
                key: 'enable',
                default: false,
                comType: 'checkbox',
              },
              {
                label: 'common.fontColor',
                key: 'fontColor',
                comType: 'fontColor',
                default: '#495057',
                watcher: {
                  deps: ['enableTotal'],
                  action: props => {
                    return {
                      disabled: props.showLabel,
                    };
                  },
                },
              },
            ],
          },
        ],
      };
      const sourceConfig = {
        styles: [
          {
            label: 'stack.title',
            key: 'stack',
            comType: 'group',
            rows: [
              {
                label: 'stack.enable',
                key: 'enable',
                default: false,
                comType: 'checkbox',
                value: true,
              },
              {
                label: 'common.fontColor',
                key: 'fontColor',
                comType: 'fontColor',
                default: '#495057',
                watcher: {
                  deps: ['enableTotal'],
                  action: props => {
                    return {
                      disabled: props.showLabel,
                    };
                  },
                },
                value: '#333333',
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result?.styles[0].rows?.[0].value).toEqual(true);
      expect(result?.styles[0].rows?.[1].value).toEqual('#333333');
    });

    test('should transfer style configs even if no comType', () => {
      const targetConfig = {
        styles: [
          {
            label: 'stack.title',
            key: 'stack',
            rows: [
              {
                label: 'stack.enable',
                key: 'enable',
                default: false,
              },
              {
                label: 'common.fontColor',
                key: 'fontColor',
                default: '#495057',
                watcher: {
                  deps: ['enableTotal'],
                  action: props => {
                    return {
                      disabled: props.showLabel,
                    };
                  },
                },
              },
            ],
          },
        ],
      };
      const sourceConfig = {
        styles: [
          {
            label: 'stack.title',
            key: 'stack',
            comType: 'group',
            rows: [
              {
                label: 'stack.enable',
                key: 'enable',
                default: false,
                comType: 'checkbox',
                value: true,
              },
              {
                label: 'common.fontColor',
                key: 'fontColor',
                comType: 'fontColor',
                default: '#495057',
                watcher: {
                  deps: ['enableTotal'],
                  action: props => {
                    return {
                      disabled: props.showLabel,
                    };
                  },
                },
                value: '#333333',
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig as any, sourceConfig);
      expect(result?.styles[0].rows?.[0].value).toEqual(true);
      expect(result?.styles[0].rows?.[1].value).toEqual('#333333');
    });

    test('should transfer style configs by using target default value', () => {
      const targetConfig = {
        styles: [
          {
            label: 'stack.title',
            key: 'stack',
            comType: 'group',
            rows: [
              {
                label: 'stack.enable',
                key: 'enable',
                default: false,
                comType: 'checkbox',
              },
            ],
          },
        ],
      };
      const sourceConfig = {
        styles: [
          {
            label: 'stack.title',
            key: 'stack',
            comType: 'group',
            rows: [
              {
                label: 'stack.enable',
                key: 'enable',
                comType: 'checkbox',
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result?.styles[0].rows?.[0].value).toEqual(false);
    });

    test('should transfer all style configs when target rows is empty', () => {
      const targetConfig = {
        styles: [
          {
            label: 'stack.title',
            key: 'stack',
            comType: 'group',
            rows: [],
          },
        ],
      };
      const sourceConfig = {
        styles: [
          {
            label: 'stack.title',
            key: 'stack',
            comType: 'group',
            rows: [
              {
                label: 'stack.enable',
                key: 'enable',
                default: false,
                comType: 'checkbox',
                value: true,
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result?.styles[0].rows?.[0]).toEqual({
        label: 'stack.enable',
        key: 'enable',
        default: false,
        comType: 'checkbox',
        value: true,
      });
    });

    test('should transfer setting configs', () => {
      const targetConfig = {
        settings: [
          {
            label: 'viz.palette.setting.paging.title',
            key: 'paging',
            comType: 'group',
            rows: [
              {
                label: 'viz.palette.setting.paging.pageSize',
                key: 'pageSize',
                default: 1000,
                comType: 'inputNumber',
                options: {
                  needRefresh: true,
                  step: 1,
                  min: 0,
                },
              },
            ],
          },
        ],
      };
      const sourceConfig = {
        settings: [
          {
            label: 'viz.palette.setting.paging.title',
            key: 'paging',
            comType: 'group',
            rows: [
              {
                label: 'viz.palette.setting.paging.pageSize',
                key: 'pageSize',
                default: 1000,
                comType: 'inputNumber',
                options: {
                  needRefresh: true,
                  step: 1,
                  min: 0,
                },
                value: 1100,
              },
            ],
          },
        ],
      };
      const result = transferChartConfigs(targetConfig, sourceConfig);
      expect(result).toEqual(sourceConfig);
    });
  });

  describe('diffHeaderRows Test', () => {
    test('should verify two different rows with different length', () => {
      const oldRows = [{ colName: 'a' }, { colName: 'b' }];
      const newRows = [{ colName: 'a' }];
      const isDifferent = diffHeaderRows(oldRows, newRows);
      expect(isDifferent).toBeTruthy();
    });

    test('should be different when have different values', () => {
      const oldRows = [{ colName: 'a' }, { colName: 'b' }];
      const newRows = [{ colName: 'a' }, { colName: 'c' }];
      const isDifferent = diffHeaderRows(oldRows, newRows);
      expect(isDifferent).toBeTruthy();
    });

    test('should be same even if order is different', () => {
      const oldRows = [{ colName: 'a' }, { colName: 'b' }];
      const newRows = [{ colName: 'b' }, { colName: 'a' }];
      const isDifferent = diffHeaderRows(oldRows, newRows);
      expect(isDifferent).toBeFalsy();
    });
  });

  describe('flattenHeaderRowsWithoutGroupRow Test', () => {
    test('should flatten to get all rows without children', () => {
      const groupHeaderRow = {
        colName: 'a',
        isGroup: undefined,
      };
      const results = flattenHeaderRowsWithoutGroupRow(groupHeaderRow);
      expect(results).toEqual([{ colName: 'a', isGroup: undefined }]);
    });

    test('should flatten to get all rows with children', () => {
      const groupHeaderRow = {
        colName: 'a',
        isGroup: true,
        children: [
          { colName: 'a-1', isGroup: false, children: [] },
          {
            colName: 'a-b',
            isGroup: true,
            children: [{ colName: 'a-b-1', isGroup: false, children: [] }],
          },
        ],
      };
      const results = flattenHeaderRowsWithoutGroupRow(groupHeaderRow);
      expect(results).toEqual([
        { colName: 'a-1', isGroup: false, children: [] },
        { colName: 'a-b-1', isGroup: false, children: [] },
      ]);
    });
  });

  describe('transformMeta Test', () => {
    test('should not transform meta when config model is empty', () => {
      const model = undefined;
      const metas = transformMeta(model);
      expect(metas).toEqual(undefined);
    });

    test('should transform meta without hierarchy and no children', () => {
      const model = JSON.stringify({ a: { type: 'STRING' } });
      const metas = transformMeta(model);
      expect(metas).toEqual([{ category: 'field', id: 'a', type: 'STRING' }]);
    });

    test('should transform meta without hierarchy but have children', () => {
      const model = JSON.stringify({
        a: {
          type: 'STRING',
          children: [{ name: 1 }, { name: 2 }],
        },
      });
      const metas = transformMeta(model);
      expect(metas).toEqual([
        { name: 1, id: 1, category: 'field' },
        { name: 2, id: 2, category: 'field' },
      ]);
    });

    test('should transform meta with hierarchy', () => {
      const model = JSON.stringify({
        hierarchy: {
          someFiled: {
            name: 'a',
            children: [
              { name: 'b', value: 1 },
              { name: 'c', value: 2 },
            ],
          },
        },
      });
      const metas = transformMeta(model);
      expect(metas).toEqual([
        { name: 'b', value: 1, id: 'b', category: 'field' },
        { name: 'c', value: 2, id: 'c', category: 'field' },
      ]);
    });
  });

  describe('getColumnRenderOriginName Test', () => {
    test('should get unknown name when config is empty', () => {
      const config = undefined;
      const result = getColumnRenderOriginName(config);
      expect(result).toEqual('[unknown]');
    });

    test('should get name without aggregate', () => {
      const config = {
        colName: 'a',
      };
      const result = getColumnRenderOriginName(config as ChartDataSectionField);
      expect(result).toEqual('a');
    });

    test('should get name with aggregate', () => {
      const config = {
        colName: 'a',
        aggregate: 'AVG',
      };
      const result = getColumnRenderOriginName(config as ChartDataSectionField);
      expect(result).toEqual('AVG(a)');
    });
  });

  describe('transformHierarchyMeta Test', () => {
    test('should get empty array when metas is null', () => {
      const metas = transformHierarchyMeta(undefined);
      expect(metas).toEqual([]);
    });

    test('should get columns when hierarchy is null or empty', () => {
      const model = {
        hierarchy: {},
        columns: {
          a: {
            name: 'a',
            primaryKey: true,
            type: 'STRING',
            category: 'UNCATEGORIZED',
            role: 'role',
          },
          b: {
            name: 'b',
            primaryKey: false,
            type: 'NUMERIC',
            category: 'UNCATEGORIZED',
            role: 'role',
          },
        },
      };
      const metas = transformHierarchyMeta(JSON.stringify(model));
      expect(metas).toEqual([
        {
          name: 'a',
          primaryKey: true,
          type: 'STRING',
          category: 'field',
          role: 'role',
          id: 'a',
          subType: 'UNCATEGORIZED',
        },
        {
          name: 'b',
          primaryKey: false,
          type: 'NUMERIC',
          category: 'field',
          role: 'role',
          id: 'b',
          subType: 'UNCATEGORIZED',
        },
      ]);
    });

    test('should get hierarchy metas', () => {
      const model = {
        hierarchy: {
          a: {
            name: 'a',
            primaryKey: true,
            type: 'STRING',
            category: 'UNCATEGORIZED',
            role: 'hierarchy',
            children: [
              {
                name: 'a-1',
                primaryKey: true,
                type: 'STRING',
                category: 'UNCATEGORIZED',
                role: 'role',
              },
              {
                name: 'a-2',
                primaryKey: true,
                type: 'NUMERIC',
                category: 'UNCATEGORIZED',
                role: 'role',
              },
            ],
          },
          b: {
            name: 'b',
            primaryKey: true,
            type: 'STRING',
            category: 'UNCATEGORIZED',
            role: 'hierarchy',
            children: [
              {
                name: 'b-1',
                primaryKey: true,
                type: 'DATE',
                category: 'UNCATEGORIZED',
                role: 'role',
              },
            ],
          },
          c: {
            name: 'c',
            primaryKey: true,
            type: 'NUMERIC',
            category: 'UNCATEGORIZED',
            role: 'role',
          },
        },
        columns: {
          x: {
            name: 'x',
            primaryKey: true,
            type: 'STRING',
            category: 'UNCATEGORIZED',
            role: 'role',
          },
        },
      };
      const metas = transformHierarchyMeta(JSON.stringify(model));
      expect(metas).toEqual([
        {
          name: 'a',
          primaryKey: true,
          type: 'STRING',
          category: 'hierarchy',
          role: 'hierarchy',
          children: [
            {
              name: 'a-1',
              primaryKey: true,
              type: 'STRING',
              category: 'field',
              role: 'role',
              id: 'a-1',
              subType: 'UNCATEGORIZED',
              children: undefined,
            },
            {
              name: 'a-2',
              primaryKey: true,
              type: 'NUMERIC',
              category: 'field',
              role: 'role',
              id: 'a-2',
              subType: 'UNCATEGORIZED',
              children: undefined,
            },
          ],
          id: 'a',
          subType: 'UNCATEGORIZED',
        },
        {
          name: 'b',
          primaryKey: true,
          type: 'STRING',
          category: 'hierarchy',
          role: 'hierarchy',
          children: [
            {
              name: 'b-1',
              primaryKey: true,
              type: 'DATE',
              category: 'field',
              role: 'role',
              id: 'b-1',
              subType: 'UNCATEGORIZED',
              children: undefined,
            },
          ],
          id: 'b',
          subType: 'UNCATEGORIZED',
        },
        {
          name: 'c',
          primaryKey: true,
          type: 'NUMERIC',
          category: 'field',
          role: 'role',
          id: 'c',
          subType: 'UNCATEGORIZED',
          children: undefined,
        },
      ]);
    });
  });
});
