import _ from 'lodash';
import { useCallback, useState } from 'react';

import { CHART_VARIABLE_ITEMS, CUSTOM_TRIGGER_TYPE } from '@/consts/codeFlowLab/items';
import {
  ChartArrayItem,
  ChartItem,
  ChartItemType,
  ChartItems,
  ChartListElItem,
  ChartUtilsItems,
  ChartVariableItem,
  CodeFlowChartDoc,
  ScriptItem,
  TriggerProps,
  ViewerItem,
} from '@/consts/types/codeFlowLab';
import { setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { nanoid } from 'nanoid';
import { useDispatch } from 'react-redux';
export * from './connect-point';

interface imageSize {
  width: number;
  height: number;
}
export const getImageSize = (_src: string): Promise<imageSize> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject('fail to load image');
    };

    img.src = _src;
  });
};

type makeDocumentParams = {
  document: any;
  keys: string[];
  value: any;
};
type makeNewDocument = (makeDocumentParams: makeDocumentParams) => CodeFlowChartDoc;
export const makeNewDocument: makeNewDocument = ({ document: _document, keys: _keys, value: _value }) => {
  let mapFunction = null;

  if (_.isArray(_document)) {
    mapFunction = _.map;

    const targetSize = Number(_keys[_keys.length - 1]) + 1;
    if (_document.length < Number(_keys[_keys.length - 1]) + 1) {
      _document = [..._document, ...new Array(targetSize - _document.length).fill(undefined)];
    }
  } else {
    mapFunction = _.mapValues;
  }

  return mapFunction(_document, (prop, propKey) => {
    if (_keys.length > 1 && `${propKey}` === `${_keys[0]}`) {
      _keys.shift();

      return makeNewDocument({
        document: prop,
        keys: _keys,
        value: _value,
      });
    } else if (_keys.length === 1 && `${propKey}` === `${_keys[0]}`) {
      return _value;
    }

    return prop;
  });
};

export const getDocumentValue = ({ document: _document, keys: _keys }) => {
  return _keys.reduce((acc, val) => (acc ? acc[val] : ''), _document);
};

export const getSceneId = (_flowScene: CodeFlowChartDoc['scene'], _sceneOrder: number) =>
  Object.keys(_flowScene).filter((_sceneKey) => _flowScene[_sceneKey].order === _sceneOrder)?.[0] || '';

export const getChartItem = (sceneItemIdList: string[], chartItem: CodeFlowChartDoc['items']) => {
  return _.pickBy(chartItem, (_item) => (sceneItemIdList || []).includes(_item.id));
};

export const useDebounceSubmitText = (_dispatchKey, isNumber = false) => {
  const [dispatchKey, setDispatchKey] = useState(_dispatchKey);
  const dispatch = useDispatch();

  const onChange = useCallback(
    _.debounce((_text) => {
      if (isNumber) {
        _text = parseInt(_text, 10);
      }

      dispatch(
        setDocumentValueAction({
          key: dispatchKey,
          value: _text,
        })
      );
    }, 800),
    []
  );

  return [onChange];
};

export const getRandomId = (_length = 8) => {
  return 'fI_' + nanoid(_length);
};

const getSize = (_target: number | string | string[], _id: string, _key: string | number) => {
  _target = typeof _target === 'number' ? `${_target}` : _target;

  if (_key && typeof _target === 'string') {
    const rgxp = new RegExp(`${_key}`, 'g');
    return (_target.match(rgxp) || []).length;
  } else if (_key && (_.isArray(_target) || typeof _target === 'string')) {
    return (_target as string[]).filter((_item) => _item === _key).length;
  } else if (_.isArray(_target) || typeof _target === 'string') {
    return _target.length;
  } else if (_target === undefined) {
    return 0;
  } else {
    return `${_target}`.length;
  }
};

export const makeVariables = (
  _viewerItem: ViewerItem,
  _items: CodeFlowChartDoc['items'],
  _sceneOrder,
  _mapItem?: {
    [id: string]: number | string;
  }
) => {
  let searched = {
    ...(_mapItem && _mapItem),
  };

  let _variableItemList: CodeFlowChartDoc['items'] = {};

  const searchUtilsVariableLoop = (_items: CodeFlowChartDoc['items'], _item: ChartUtilsItems, _sceneOrder: number) => {
    const isSkipCheckVar = [ChartItemType.condition, ChartItemType.calculator].includes(_item.elType);

    if (!_item.connectionVariables?.[0] && !isSkipCheckVar) {
      return undefined;
    }

    if (searched[_item.id]) {
      return searched[_item.id];
    }

    const _targetId = _item.connectionVariables[0]?.connectParentId;
    const _textId = _item.connectionVariables[1]?.connectParentId;

    if (![...CHART_VARIABLE_ITEMS, ChartItemType.listEl].includes(_items[_targetId]?.elType) && !isSkipCheckVar) {
      return undefined;
    }

    const setVal = (__id, _index) => {
      let __result;

      if (!searched[__id]) {
        if (__id && _items[__id].elType === ChartItemType.sceneOrder) {
          return `${_sceneOrder}`;
        } else if (__id && _items[__id].elType === ChartItemType.array) {
          __result = (_items[__id] as ChartArrayItem).list;

          searched = {
            ...searched,
            [__id]: __result,
          };

          return __result;
        } else if (__id && _items[__id].elType === ChartItemType.listEl) {
          return searched[(_items[__id] as ChartListElItem).elId];
        } else if (__id && _items[__id].elType !== ChartItemType.variable) {
          __result = searchUtilsVariableLoop(_items, _items[__id] as ChartUtilsItems, _sceneOrder);

          searched = {
            ...searched,
            [__id]: __result,
          };

          return __result;
        } else if (__id && _items[__id].elType === ChartItemType.variable) {
          __result = (_items[__id] as ChartVariableItem).var;

          searched = {
            ...searched,
            [__id]: __result,
          };

          return __result;
        } else if (_item.elType === ChartItemType.condition) {
          return _item.textList[_index];
        } else if (_item.elType === ChartItemType.calculator) {
          return _item.textList[_index];
        } else {
          return _item.text;
        }
      } else {
        return searched[__id];
      }
    };

    const __var = setVal(_targetId, 0);
    const __text = setVal(_textId, 1);

    switch (_item.elType) {
      case ChartItemType.get:
        return __var?.[__text];
      case ChartItemType.size:
        return getSize(__var, _targetId, __text);
      case ChartItemType.includes:
        return (typeof __var === 'number' ? `${__var}` : __var).includes(`${__text}`) ? 1 : 0;
      case ChartItemType.indexOf:
        return (typeof __var === 'number' ? `${__var}` : __var).indexOf(`${__text}`);
      case ChartItemType.condition:
      case ChartItemType.calculator:
        const _values = [__var, __text];
        const __code = _item.textList.reduce((_acc, _cur, _index) => {
          let _text = '';
          let _var = _values[_index];

          if (_item.elType === ChartItemType.calculator) {
            _var = typeof _var === 'number' ? _var : _var.length;
          }

          if (_index !== 0) {
            _text += _item.operator;
          }

          _text += JSON.stringify(_.isUndefined(_var) ? _cur : _var);

          return _acc + _text;
        }, '');

        const conditionResult = new Function(`return ${__code}`)();

        if (_item.elType === ChartItemType.condition) {
          return conditionResult ? 1 : 0;
        } else {
          return conditionResult;
        }

      default:
        return undefined;
    }
  };

  const findVariableItemInVar = (_item: ChartItem) => {
    (_item?.connectionVariables || []).forEach((_var) => {
      if (_var?.connectParentId && !_variableItemList[_var.connectParentId]) {
        _variableItemList[_var.connectParentId] = _items[_var.connectParentId];

        findVariableItemInVar(_items[_var.connectParentId]);
      }
    });
  };

  const findVariableItemInTrigger = (_items: ScriptItem[]) => {
    _items.forEach((_item) => {
      _item.script.forEach((__item) => {
        findVariableItemInVar(__item);
      });

      findVariableItemInTrigger(_item.script as ScriptItem[]);
    });
  };

  findVariableItemInVar(_viewerItem);

  findVariableItemInTrigger(_viewerItem.triggers);

  return _.mapValues(_variableItemList, (_item) => {
    switch (_item.elType) {
      case ChartItemType.variable:
        return _item.var;
      case ChartItemType.array:
        return _item.list;

      case ChartItemType.condition:
      case ChartItemType.calculator:
      case ChartItemType.size:
      case ChartItemType.includes:
      case ChartItemType.indexOf:
      case ChartItemType.get:
        return searchUtilsVariableLoop(_items, _item, _sceneOrder);
      case ChartItemType.sceneOrder:
        return `${_sceneOrder}`;
      case ChartItemType.listEl:
        return searched[_item.elId];
      default:
        return undefined;
    }
  });
};

export const getElementTrigger = (_triggerProps: TriggerProps) =>
  _.pickBy(_triggerProps, (_trigger, _key) => !CUSTOM_TRIGGER_TYPE.includes(_key));
