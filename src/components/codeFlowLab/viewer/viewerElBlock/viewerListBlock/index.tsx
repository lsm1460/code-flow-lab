import { ChartListItem, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import React, { CSSProperties, RefObject, useMemo } from 'react';
import ViewerElBlock from '..';
import _ from 'lodash';

interface ListViewerItem extends ViewerItem {
  size?: ChartListItem['size'];
  useIndex?: ChartListItem['useIndex'];
}

interface Props {
  elRef: RefObject<HTMLDivElement>;
  viewerItem: ListViewerItem;
  triggerProps: TriggerProps;
  variables: {
    [x: string]: any;
  };
  addedStyle: CSSProperties;
  mapItem;
}
function ViewerListBlock({ elRef, viewerItem, triggerProps, variables, addedStyle, mapItem }: Props) {
  const arrayVariable = useMemo(() => {
    const __var = variables[viewerItem.connectionVariables[0]?.connectParentId];
    if (__var !== undefined && !_.isArray(__var)) {
      return (__var || '').split('');
    } else {
      return __var;
    }
  }, [variables, viewerItem]);

  return (
    <div ref={elRef} style={{ ...viewerItem.styles, ...addedStyle }} {...triggerProps}>
      {(arrayVariable || new Array(viewerItem.size).fill(undefined)).map((_var, _index) => (
        <React.Fragment key={_index}>
          {viewerItem.children.map((_item) => (
            <ViewerElBlock
              key={_item.id}
              viewerItem={_item}
              mapItem={{ ...mapItem, [viewerItem.id]: viewerItem.useIndex ? _index : _var }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

export default ViewerListBlock;
