import _ from 'lodash';
import { useCallback, useState } from 'react';

import { getNewPos } from '@/components/codeFlowLab/editor/flowChart/utils';
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
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
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

type MakeDocumentParams = {
  document: any;
  keys: string[];
  value: any;
  debug: string;
  count?: number;
};
type MakeNewDocument = (makeDocumentParams: MakeDocumentParams) => CodeFlowChartDoc;
export const makeNewDocument: MakeNewDocument = ({
  document: _document,
  keys: _keys,
  value: _value,
  debug = '',
  count = 0,
}) => {
  let isFind = false;
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
    if (!isFind && _keys.length > 1 && `${propKey}` === `${_keys[0]}`) {
      isFind = true;
      _keys.shift();

      return makeNewDocument({
        document: prop,
        keys: _keys,
        value: _value,
        debug: debug + `.${propKey}`,
        count: count + 1,
      });
    } else if (!isFind && _keys.length === 1 && `${propKey}` === `${_keys[0]}`) {
      isFind = true;

      return _value;
    }

    return prop;
  });
};

export const getDocumentValue = ({ document: _document, keys: _keys }) => {
  return _keys.reduce((acc, val) => (acc ? acc[val] : ''), _document);
};

export const getSceneId = (_flowScene: CodeFlowChartDoc['scene'], _sceneOrder: number, _selectedGroupId?: string) => {
  if (_selectedGroupId) {
    return _selectedGroupId;
  }

  return Object.keys(_flowScene).filter((_sceneKey) => _flowScene[_sceneKey].order === _sceneOrder)?.[0] || '';
};

export const getChartItem = (
  sceneItemIdList: string[],
  chartItem: CodeFlowChartDoc['items'],
  _selectedGroupId: string,
  _group: CodeFlowChartDoc['group']
) => {
  if (_selectedGroupId) {
    sceneItemIdList = _group[_selectedGroupId];
  }

  return _.pickBy(chartItem, (_item) => (sceneItemIdList || []).includes(_item.id));
};

export const useDebounceSubmitText = (_dispatchKey, isNumber = false, isSkip = false) => {
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
          isSkip,
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

const getSize = (_target: number | string | string[], _key: string | number) => {
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

const getReplaced = (_target: string | string[], _key: string, _value: string, _asIndex: boolean) => {
  const _targetKey = _asIndex ? parseInt(_key) || 0 : _key;
  if (_asIndex && typeof _target === 'string') {
    let _targetArray = _target.split('');

    _targetArray[_targetKey] = _value;

    return _targetArray.join('');
  } else if (!_asIndex && typeof _target === 'string') {
    return _target.replaceAll(_key, _value);
  } else if (_asIndex && typeof _target !== 'string') {
    return _target.map((_var, _i) => (_i === _targetKey ? _value : _var));
  } else if (!_asIndex && typeof _target !== 'string') {
    return _target.map((_var, _i) => (_var === _targetKey ? _value : _var));
  } else {
    return _.cloneDeep(_target);
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
        } else if (_item.elType === ChartItemType.replace) {
          if (_index === 1) {
            return _item.text;
          } else {
            return _item.key;
          }
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
        return getSize(__var, __text);
      case ChartItemType.includes:
        return (typeof __var === 'number' ? `${__var}` : __var).includes(`${__text}`) ? 1 : 0;
      case ChartItemType.indexOf:
        return (typeof __var === 'number' ? `${__var}` : __var).indexOf(`${__text}`);
      case ChartItemType.replace:
        const _keyId = _item.connectionVariables[2]?.connectParentId;
        const __targetkey = setVal(_keyId, 2);
        const ___v = getReplaced(__var, __targetkey, __text, _item.asIndex);
        return ___v;
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
      case ChartItemType.replace:
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

export const getGroupItemIdList = (_group: CodeFlowChartDoc['group'], _idList: string[]) => {
  return _.flatten(
    _idList.map((_id) => {
      if (_group[_id]) {
        return [_id, ...getGroupItemIdList(_group, _group[_id])];
      } else {
        return _id;
      }
    })
  );
};

export const filterDeleteTargetId = (
  chartItems: CodeFlowChartDoc['items'],
  group: CodeFlowChartDoc['group'],
  scene: CodeFlowChartDoc['scene'],
  _idList: string[]
) => {
  return _idList.filter((_itemId) => {
    if ([ChartItemType.variable, ChartItemType.array, ChartItemType.group].includes(chartItems[_itemId]?.elType)) {
      let count = Object.values(scene).reduce((_acc, _cur) => {
        if (_cur.itemIds.includes(_itemId)) {
          return ++_acc;
        }

        return _acc;
      }, 0);

      count = Object.values(group).reduce((_acc, _cur) => {
        if (_cur.includes(_itemId)) {
          return ++_acc;
        }

        return _acc;
      }, count);

      return count === 1;
    }

    return true;
  });
};

export const makePasteOperations = (
  chartItems: CodeFlowChartDoc['items'],
  itemsPos: CodeFlowChartDoc['itemsPos'],
  group: CodeFlowChartDoc['group'],
  items: CodeFlowChartDoc['items'],
  pos: CodeFlowChartDoc['itemsPos'],
  copiedGroup: CodeFlowChartDoc['group'],
  selectedGroupId: string,
  selectedSceneId: string,
  sceneItemIds: string[]
) => {
  const _items = selectedGroupId
    ? _.pickBy(chartItems, (_item, _itemId) => group[selectedGroupId].includes(_itemId))
    : chartItems;

  const sceneItemSize = Object.keys(getChartItem(sceneItemIds, _items, selectedGroupId, group)).length;

  const copiedIdList = Object.keys(items);
  const changedIds = _.mapValues(_.mapKeys(copiedIdList), () => getRandomId());

  const operations = Object.values(items).reduce<Operation[]>(
    (_acc, _cur: ChartItems, _index) => {
      const newItemId = changedIds[_cur.id];

      let _val;
      let __groupId = '';

      for (let _id in copiedGroup) {
        if (copiedGroup[_id].includes(_cur.id)) {
          __groupId = _id;
          break;
        }
      }

      return _acc.map((_op) => {
        if (_op.key === 'items') {
          let connectionIds = _.mapValues(_cur.connectionIds, (_pointList, _dir) =>
            _pointList
              .map(
                (_point) =>
                  changedIds[_point.connectParentId] && {
                    ..._point,
                    parentId: newItemId,
                    connectParentId: changedIds[_point.connectParentId],
                  }
              )
              .filter((_point) => _point)
          );

          _val = {
            ..._op.value,
            [newItemId]: {
              ..._cur,
              id: newItemId,
              connectionIds,
              zIndex: sceneItemSize + _index + 1,
              ...(_cur.connectionVariables && {
                connectionVariables: _cur.connectionVariables
                  .map(
                    (_point) =>
                      changedIds[_point.connectParentId] && {
                        ..._point,
                        parentId: newItemId,
                        connectParentId: changedIds[_point.connectParentId],
                      }
                  )
                  .filter((_point) => _point),
              }),
              ...(_cur.elType === ChartItemType.group && {
                rootId: changedIds[_cur.rootId],
              }),
            },
          };
        } else if (_op.key === 'itemsPos') {
          if (__groupId) {
            _val = {
              ..._op.value,
              [newItemId]: {
                [changedIds[__groupId]]: getNewPos(itemsPos, selectedSceneId, pos[_cur.id][__groupId]),
              },
            };
          } else {
            _val = {
              ..._op.value,
              [newItemId]: {
                [selectedSceneId]: getNewPos(
                  itemsPos,
                  selectedSceneId,
                  Object.values(pos[_cur.id])[0] as { left: number; top: number }
                ),
              },
            };
          }
        } else if (_op.key === 'group') {
          if (changedIds[__groupId]) {
            _val = {
              ..._op.value,
              [changedIds[__groupId]]: [...(_op.value[changedIds[__groupId]] || []), newItemId],
            };
          } else {
            _val = _op.value;
          }
        } else {
          if (__groupId) {
            _val = _op.value;
          } else {
            _val = [..._op.value, newItemId];
          }
        }

        return { ..._op, value: _val };
      });
    },
    [
      {
        key: 'items',
        value: chartItems,
      },
      {
        key: `itemsPos`,
        value: itemsPos,
      },
      {
        key: 'group',
        value: group,
      },
      {
        key: selectedGroupId ? `group.${selectedGroupId}` : `scene.${selectedSceneId}.itemIds`,
        value: selectedGroupId ? group[selectedGroupId] : sceneItemIds,
      },
    ]
  );

  return operations;
};
