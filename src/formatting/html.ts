import { IResult, ITest, ITestSuit, TestOutcome } from '../data';
import { formatElapsedTime, getSectionLink } from './common';

interface Element {
  tag: string;
  attributes?: { [index: string]: string };
}

interface Header {
  name: string;
  align?: 'left' | 'right' | 'center';
}

const outcomeIcons: { [key in TestOutcome]: string } = {
  Passed: '✔️',
  Failed: '❌',
  NotExecuted: '⚠️'
};

export const formatTitleHtml = (title: string): string =>
  wrap(title, { tag: 'h1', attributes: { id: getSectionLink(title) } });

export const formatResultHtml = (result: IResult): string => {
  let html = wrap('Test Results', 'h3');

  html += formatTable(
    [{ name: '🧪 Passed' }, { name: '❌ Failed' }, { name: '⚠️ Skipped' }, { name: '⏱️ Time' }],
    [[`${result.passed}`, `${result.failed}`, `${result.skipped}`, formatElapsedTime(result.elapsed)]]
  );

  html += result.suits.filter((suit) => !suit.success).map(formatTestSuit).join('');

  return html;
};

const formatTestSuit = (suit: ITestSuit): string => {
  const icon = '🚨';
  const summary = `${icon} ${suit.name} - ${suit.passed}/${suit.tests.length}`;
  const hasOutput = suit.tests.some(test => test.output || test.error);

  const table = formatTable(
    [{ name: 'Result', align: 'center' }, { name: 'Test' }, ...(hasOutput ? [{ name: 'Output' }] : [])],
    suit.tests.map(test => [outcomeIcons[test.outcome], test.name, ...(hasOutput ? [formatTestOutput(test)] : [])])
  );

  return formatDetails(summary, table);
};

const formatTestOutput = (test: ITest): string => {
  let output = test.output;

  if (test.error) {
    output += `${output ? '<br/><br/>' : ''}<b>Error Message</b><br/>${test.error}`;
  }

  if (test.trace) {
    output += `${output ? '<br/><br/>' : ''}<b>Stack Trace</b><br/>${test.trace}`;
  }

  return output;
};

const wrap = (item: string, element: string | Element): string => {
  let tag: string = '';
  let attributes: string = '';

  if (typeof element === 'string') {
    tag = element;
  } else {
    tag = element.tag;
    attributes = element.attributes
      ? Object.keys(element.attributes)
          .map(a => ` ${a}="${element.attributes?.[a]}"`)
          .join('')
      : '';
  }

  return `<${tag}${attributes}>${item}</${tag}>`;
};

const wrapMany = (items: string[], element: string | Element): string =>
  items.map(item => wrap(item, element)).join('');

const formatDetails = (summary: string, details: string): string =>
  wrap(`${wrap(summary, 'summary')}<br/>${details}`, 'details');

const formatColumn = (column: string, header: Header): string =>
  wrap(column, { tag: 'td', attributes: header.align ? { align: header.align } : undefined });

const formatTable = (headers: Header[], rows: string[][]): string => {
  const headerNames = headers.map(h => h.name);
  const headersData = wrapMany(headerNames, 'th');
  const headersHtml = wrap(headersData, 'tr');

  const rowsData = rows.map(row => row.map((column, i) => formatColumn(column, headers[i])).join(''));
  const rowsHtml = wrapMany(rowsData, 'tr');
  const bodyHtml = wrap(`${headersHtml}${rowsHtml}`, 'tbody');

  return wrap(bodyHtml, { tag: 'table', attributes: { role: 'table' } });
};
