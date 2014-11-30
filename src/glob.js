import Promise from 'bluebird'
import _ from 'lodash'
import _glob from 'glob'
import gaze from 'gaze'

var glob = Promise.promisify(_glob)

function build(operation, patterns) {
  console.log("glob build: => %j", patterns, operation.inputs)
  return Promise.all(
    Promise
      .all(patterns.map(pattern => glob(pattern)))
      .then(_.flatten)
      .map(filePath => operation.makeResource(filePath).loadFromFs())
  )
}

function watch(operation, patterns) {
  // debounce delay doesn't help much for when vim moves files
  gaze(patterns, { debounceDelay: 200 }, function(err, watcher) {
    if (err) {
      console.warn('Problem establishing filesystem watch')
      return
    }

    watcher.on('all', (event, filepath) => {
      console.log(event, filepath)
    })
  })
  // TODO: register glob watches and call operation.next when they fire
  return []
}

export default function(...patterns) {
  return operation => {
    operation.assertSource()
    return build(operation, patterns).then(resources => {
      if (operation.forWatch)
        watch(operation, patterns)
      return resources
    })
  }
}
