import { ViewerItem } from '@/consts/types/codeFlowLab';
import React, { useMemo } from 'react';
import ViewerElBlock from '..';

interface Props {
  viewerItem: ViewerItem;
  variables: {
    [x: string]: any;
  };
  mapItem;
  isOnlyViewer: boolean;
}
function ViewerIfBlock({ viewerItem, variables, mapItem, isOnlyViewer }: Props) {
  const condition = useMemo(
    () => variables[viewerItem.connectionVariables[0]?.connectParentId],
    [variables, viewerItem]
  );

  return (
    <React.Fragment>
      {!!condition &&
        viewerItem.children.map((_item) => (
          <ViewerElBlock key={_item.id} viewerItem={_item} mapItem={mapItem} isOnlyViewer={isOnlyViewer} />
        ))}
    </React.Fragment>
  );
}

export default ViewerIfBlock;
