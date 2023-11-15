import { ChartListItem, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import React, { CSSProperties, RefObject, useMemo } from 'react';
import ViewerElBlock from '..';

interface ListViewerItem extends ViewerItem {
  size?: ChartListItem['size'];
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
  const arrayVariable = useMemo(
    () => variables[viewerItem.connectionVariables[0]?.connectParentId],
    [variables, viewerItem]
  );

  return (
    <div ref={elRef} style={{ ...viewerItem.styles, ...addedStyle }} {...triggerProps}>
      {(arrayVariable || new Array(viewerItem.size).fill(undefined)).map((_var, _index) => (
        <React.Fragment key={_index}>
          {viewerItem.children.map((_item) => (
            <ViewerElBlock
              key={_item.id}
              viewerItem={_item}
              variables={variables}
              mapItem={{ ...mapItem, [viewerItem.id]: [_var, _index] }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

export default ViewerListBlock;
