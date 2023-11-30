import {
  CHART_ELEMENT_ITEMS,
  CHART_SCRIPT_ITEMS,
  CHART_VARIABLE_ITEMS,
  FLOW_CHART_ITEMS_STYLE,
  FLOW_ITEM_ADDITIONAL_INFO,
  FLOW_ITEM_DEFAULT_INFO,
  ROOT_BLOCK_ID,
} from '@/consts/codeFlowLab/items';
import {
  ChartBodyItem,
  ChartGroupItem,
  ChartItemPos,
  ChartItemType,
  ChartItems,
  CodeFlowChartDoc,
} from '@/consts/types/codeFlowLab';
import { Operation } from '@/reducers/contentWizard/mainDocument';
import { getRandomId } from '@/utils/content';
import _ from 'lodash';

type IPolygon = { x: number; y: number }[];
export function doPolygonsIntersect(a: IPolygon, b: IPolygon) {
  const polygons = [a, b];
  let minA, maxA, projected, minB, maxB;

  for (let i = 0; i < polygons.length; i++) {
    // for each polygon, look at each edge of the polygon, and determine if it separates
    // the two shapes
    const polygon = polygons[i];
    for (let i1 = 0; i1 < polygon.length; i1++) {
      // grab 2 vertices to create an edge
      const i2 = (i1 + 1) % polygon.length;
      const p1 = polygon[i1];
      const p2 = polygon[i2];

      // find the line perpendicular to this edge
      const normal = { x: p2.y - p1.y, y: p1.x - p2.x };

      minA = maxA = undefined;
      // for each vertex in the first shape, project it onto the line perpendicular to the edge
      // and keep track of the min and max of these values
      for (let j = 0; j < a.length; j++) {
        projected = normal.x * a[j].x + normal.y * a[j].y;
        if (_.isUndefined(minA) || projected < minA) {
          minA = projected;
        }
        if (_.isUndefined(maxA) || projected > maxA) {
          maxA = projected;
        }
      }

      // for each vertex in the second shape, project it onto the line perpendicular to the edge
      // and keep track of the min and max of these values
      minB = maxB = undefined;
      for (let j = 0; j < b.length; j++) {
        projected = normal.x * b[j].x + normal.y * b[j].y;
        if (_.isUndefined(minB) || projected < minB) {
          minB = projected;
        }
        if (_.isUndefined(maxB) || projected > maxB) {
          maxB = projected;
        }
      }

      // if there is no overlap between the projects, the edge we are looking at separates the two
      // polygons, and we know there is no overlap
      if (maxA < minB || maxB < minA) {
        return false;
      }
    }
  }
  return true;
}

interface IPoint {
  x: number;
  y: number;
}

function getAngle(element: HTMLElement): number {
  const style = window.getComputedStyle(element);
  const matrix = new WebKitCSSMatrix(style.webkitTransform);
  return Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
}

export function getRectPoints(element: HTMLElement): IPoint[] {
  const rect = element.getBoundingClientRect();
  const x = rect.left;
  const y = rect.top;
  const width = rect.width;
  const height = rect.height;
  const angle = getAngle(element);

  const radian = (angle * Math.PI) / 180;
  const cos = Math.cos(radian);
  const sin = Math.sin(radian);

  const x1 = x + width * cos;
  const y1 = y + width * sin;

  const x2 = x1 + height * -sin;
  const y2 = y1 + height * cos;

  const x3 = x2 + width * -cos;
  const y3 = y2 + height * -sin;

  return [
    { x, y },
    { x: x1, y: y1 },
    { x: x2, y: y2 },
    { x: x3, y: y3 },
  ];
}

export const checkVariableBlock = (_elType: ChartItemType) => {
  return CHART_VARIABLE_ITEMS.includes(_elType);
};

export const getBlockType = (_elType, _isDeep = false) => {
  if (checkVariableBlock(_elType)) {
    return ChartItemType.variable;
  }

  // 트리거는 function만 붙일 수 있도록 예외처리 추가
  if ([...CHART_ELEMENT_ITEMS, ChartItemType.group].includes(_elType)) {
    if ((_isDeep && _elType === ChartItemType.span) || _elType === ChartItemType.listEl) {
      return ChartItemType.span;
    }

    return ChartItemType.el;
  } else if (CHART_SCRIPT_ITEMS.includes(_elType)) {
    if (_isDeep) {
      return _elType;
    }

    return ChartItemType.script;
  }

  return _elType;
};

export const getConnectSizeByType = (
  _idsByDic: ChartItems['connectionIds'],
  _chartItems: CodeFlowChartDoc['items'],
  _sceneItemIds: string[],
  _isDeep: boolean
) => {
  return _.mapValues(_idsByDic, (_ids) => {
    _ids = _ids.filter((_point) => _sceneItemIds.includes(_point.connectParentId));

    const typeGroup = _.groupBy(_ids, (_point) => _point.connectType);
    return _.mapValues(typeGroup, (_ids) => _ids.length);
  });
};

export const getNewPos = (
  itemsPos: CodeFlowChartDoc['itemsPos'],
  sceneId: string,
  _pos: { left: number; top: number }
) => {
  let isMatchFlag = false;

  for (let _origin of Object.values(itemsPos)) {
    if (_origin[sceneId]?.left === _pos.left && _origin[sceneId]?.top === _pos.top) {
      isMatchFlag = true;
      break;
    }
  }

  if (isMatchFlag) {
    return getNewPos(itemsPos, sceneId, { left: _pos.left + 10, top: _pos.top + 10 });
  } else {
    return _pos;
  }
};

export const getCenterPos = (zoomArea: HTMLElement) => {
  const { scale, transX, transY } = zoomArea.dataset;
  const { width, height } = zoomArea.parentElement.getBoundingClientRect();

  return {
    left: width / parseFloat(scale) / 2 - parseFloat(transX),
    top: height / parseFloat(scale) / 2 - parseFloat(transY),
  };
};

export const makeNewItem = (
  zoomArea: HTMLElement,
  chartItems: CodeFlowChartDoc['items'],
  selectedChartItems: CodeFlowChartDoc['items'],
  itemsPos: CodeFlowChartDoc['itemsPos'],
  itemType: ChartItemType,
  sceneId: string,
  __pos?: { left: number; top: number }
): [ChartItems, ChartItemPos, string] => {
  const newItemId = getRandomId();

  const itemList = Object.values(selectedChartItems);
  const itemSize = Object.values(chartItems).filter((_item) => _item.elType === itemType).length;

  let _pos = __pos ? __pos : getCenterPos(zoomArea);

  _pos = getNewPos(itemsPos, sceneId, _pos);

  return [
    {
      ...FLOW_ITEM_DEFAULT_INFO,
      id: newItemId,
      name: `${itemType.replace(/\b[a-z]/g, (char) => char.toUpperCase())}-${itemSize + 1}`,
      elType: itemType,
      zIndex: itemList.length + 1,
      connectionIds: _.mapValues(FLOW_CHART_ITEMS_STYLE[itemType].connectionTypeList, () => []),
      ...(FLOW_ITEM_ADDITIONAL_INFO[itemType] && FLOW_ITEM_ADDITIONAL_INFO[itemType]),
    },
    { [sceneId]: _pos },
    newItemId,
  ];
};

export const makeNewRoot = (_sceneOrder: number): ChartBodyItem => {
  return {
    id: `${ROOT_BLOCK_ID}-${_sceneOrder}`,
    name: 'root-name',
    elType: ChartItemType.body,
    zIndex: 1,
    connectionIds: {
      right: [],
    },
  };
};

export const getCanvasLineColor = (_originElType: ChartItemType, _nextElType: ChartItemType) => {
  const _sortedType = _.sortBy([_nextElType, _originElType]);

  if (_.isEqual(_sortedType, [ChartItemType.addStyle, ChartItemType.style])) {
    return '#d3c355';
  } else if (_.isEqual(_sortedType, [ChartItemType.style, ChartItemType.style])) {
    return '#2ec438';
  } else if (_sortedType.includes(ChartItemType.style)) {
    return '#2e7d32';
  } else if (_sortedType.includes(ChartItemType.span)) {
    return '#a764db';
  } else if (_sortedType.includes(ChartItemType.variable)) {
    return '#ffc95c';
  } else if (
    _sortedType.includes(ChartItemType.script) ||
    _.isEqual(_sortedType, [ChartItemType.function, ChartItemType.function])
  ) {
    return '#dadada';
  } else if (_sortedType.includes(ChartItemType.function)) {
    return '#cd823d';
  } else if (_sortedType.includes(ChartItemType.trigger)) {
    return '#e36775';
  } else if (_sortedType.includes(ChartItemType.el)) {
    return '#7b7be8';
  } else {
    return 'red';
  }
};

export const getOperationsForGroup = (_operations: Operation | Operation[], _selectedGroupId): Operation[] => {
  // group이 열려있을때 오퍼레이션을 확인하여 앞에 group이 없을 때 추가함!!

  let operations;

  if (!_.isArray(_operations)) {
    operations = [{ ..._operations }];
  } else {
    operations = _.map(_operations, (operation) => ({
      ...operation,
    }));
  }

  return operations
    .filter((_op) => (_selectedGroupId ? !_op.key.startsWith('scene') : true))
    .map((_op) => ({
      ..._op,
      key: _selectedGroupId && _op.key.startsWith('items') ? `group.${_selectedGroupId}.` + _op.key : _op.key,
    }));
};
