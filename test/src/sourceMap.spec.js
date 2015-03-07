require('chai').should()
var { Bacon } = require('baconjs')
import { SourceMapConsumer } from 'source-map'
import path from 'path'

import { positionOf } from '../lib/sourceMap'
import Event from '../lib/event'
import concat from '../lib/plugin/concat'
import babel from '../lib/plugin/babel'

describe('sourceMap helper module', () => {
  var makeEvent = num => new Event({
    path: `file${num}.js`,
    type: 'add',
    opTreeIndex: num,
    data: `var add${num} = b => b + ${num}`
  })

  describe('positionOf', () => {
    it('returns line/column of match on third line', () => {
      var pos = positionOf('111\n222\n3a\n14', 'a')
      pos.line.should.equal(3)
      pos.column.should.equal(1)
    })

    it('returns null for failed match', () => {
      var pos = positionOf('111\n222\n3a\n14', 'b')
      // TODO: test is null, chai website is down right now
    })
  })

  it('applies one source map to another', () => {
    var inputStream = Bacon.once([1, 2].map(num => makeEvent(num)))
    var concatStream = concat({ stream: inputStream }, 'output.js', 10)
    var babelStream = babel({ stream: concatStream })

    return babelStream.toPromise().then(events => {
      events.length.should.equal(1)
      var { sourceMap, data } = events[0]

      var consumer = new SourceMapConsumer(sourceMap)
      // verify mapping of token "add1"
      var pos = consumer.originalPositionFor(positionOf(data, 'add1'))
      pos.line.should.equal(1)
      pos.column.should.equal(4)
      pos.source.should.equal(path.join(process.cwd(), 'file1.js'))

      // verify mapping of token "add2"
      pos = consumer.originalPositionFor(positionOf(data, 'add2'))
      pos.line.should.equal(1)
      pos.column.should.equal(4)
      pos.source.should.equal(path.join(process.cwd(), 'file2.js'))
    })
  })
})
