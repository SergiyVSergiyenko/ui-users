import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {
  Row,
  Col,
  Accordion,
  Icon,
  MultiColumnList,
  Button,
  Headline
} from '@folio/stripes/components';
import moment from 'moment';

class PatronBlock extends React.Component {
  static manifest = Object.freeze({
    userPatronBlocks: {
      type: 'okapi',
      records: 'manualblocks',
      path: 'manualblocks?query=userId=:{id}',
      DELETE: {
        path: 'manualblocks/%{activeRecord.id}'
      },
    },
    activeRecord: {},
  });

  static propTypes = {
    resources: PropTypes.shape({
      manualblocks: PropTypes.shape({
        records: PropTypes.arrayOf(PropTypes.object),
      }),
    }),
    stripes: PropTypes.shape({
      intl: PropTypes.object.isRequired,
    }),
    mutator: PropTypes.shape({
      userPatronBlocks: PropTypes.shape({
        DELETE: PropTypes.func,
      }),
      activeRecord: PropTypes.shape({
        update: PropTypes.func,
      }),
    }),
    onClickViewPatronBlock: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.onSort = this.onSort.bind(this);
    this.onRowClick = this.onRowClick.bind(this);

    const { stripes } = props;

    this.sortMap = {
      [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.type' })]: f => f.type,
      [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.desc' })]: f => f.desc,
      [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.blocked' })]: f => f.renewals,
    };

    this.state = {
      sortOrder: [
        stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.type' }),
        stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.desc' }),
        stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.blocked' }),
      ],
      sortDirection: ['desc', 'asc'],
    };
  }

  componentDidUpdate(prevProps) {
    const prevBlocks = _.get(prevProps.resources, ['userPatronBlocks', 'records'], []);
    const patronBlocks = _.get(this.props.resources, ['userPatronBlocks', 'records'], []);

    if (JSON.stringify(prevBlocks) !== JSON.stringify(patronBlocks)) {
      const expirated = patronBlocks.filter(p => moment(moment(p.expirationDate).format()).isBefore(moment().format())) || [];
      expirated.forEach(block => {
        this.props.mutator.activeRecord.update({ id: block.id });
        this.props.mutator.userPatronBlocks.DELETE({ id: block.id });
      });
    }
  }

  onSort(e, meta) {
    if (!this.sortMap[meta.alias]) return;

    let { sortOrder, sortDirection } = this.state;

    if (sortOrder[0] !== meta.alias) {
      sortOrder = [meta.alias, sortOrder[1]];
      sortDirection = ['asc', sortDirection[1]];
    } else {
      const direction = (sortDirection[0] === 'desc') ? 'asc' : 'desc';
      sortDirection = [direction, sortDirection[1]];
    }
    this.setState({ sortOrder, sortDirection });
  }

  onRowClick(e, row) {
    if ((e.target.type !== 'button') && (e.target.tagName !== 'IMG')) {
      this.props.onClickViewPatronBlock(e, 'edit', row);
    }
  }

  getPatronFormatter() {
    const { stripes } = this.props;
    return {
      [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.type' })]: f => f.type,
      [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.desc' })]: f => f.desc,
      [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.blocked' })]: f => `${f.borrowing ? [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.borrowing' })] : ''}${f.renewals && f.borrowing ? ', ' : ''}${f.renewals ? [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.renewals' })] : ''}${(f.requests && f.renewals) || (f.borrowing && f.requests) ? ', ' : ''}${f.requests ? [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.requests' })] : ''}`,
    };
  }

  render() {
    const props = this.props;
    const { expanded, onToggle, accordionId, stripes } = props;
    const { sortOrder, sortDirection } = this.state;
    const visibleColumns = [
      stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.type' }),
      stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.desc' }),
      stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.blocked' }),
    ];
    const manualBlocks = _.get(this.props.resources, ['userPatronBlocks', 'records'], []);
    const contentData = _.orderBy(manualBlocks, [this.sortMap[sortOrder[0]], this.sortMap[sortOrder[1]]], sortDirection);
    const displayWhenOpen =
      <Button onClick={e => { props.onClickViewPatronBlock(e, 'add'); }}>{this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.buttons.add' })}</Button>;

    const items = (manualBlocks.length === 0) ? '' :
    <MultiColumnList
      contentData={contentData}
      formatter={this.getPatronFormatter()}
      visibleColumns={visibleColumns}
      onHeaderClick={this.onSort}
      sortOrder={sortOrder[0]}
      sortDirection={`${sortDirection[0]}ending`}
      onRowClick={this.onRowClick}
      columnWidths={{
        [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.type' })]: 100,
        [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.desc' })]: 350,
        [stripes.intl.formatMessage({ id: 'ui-users.blocks.columns.blocked' })]: 250
      }}
    />;
    const title =
      <Row>
        <Col><Headline style={{ 'marginLeft': '8px' }} size="large" tag="h3">{this.props.stripes.intl.formatMessage({ id: 'ui-users.blocks.label' })}</Headline></Col>
        <Col>{(props.hasPatronBlocks) ? <Icon size="medium" icon="validation-error" status="error" /> : ''}</Col>
      </Row>;

    return (
      <Accordion
        open={expanded}
        id={accordionId}
        onToggle={onToggle}
        label={title}
        displayWhenOpen={displayWhenOpen}
      >
        {items}
      </Accordion>
    );
  }
}

export default PatronBlock;
