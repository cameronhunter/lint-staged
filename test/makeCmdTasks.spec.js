import execa from 'execa'
import makeCmdTasks from '../src/makeCmdTasks'

describe('makeCmdTasks', () => {
  const gitDir = process.cwd()

  beforeEach(() => {
    execa.mockClear()
  })

  it('should return an array', async () => {
    const array = await makeCmdTasks('test', false, gitDir, ['test.js'])
    expect(array).toBeInstanceOf(Array)
  })

  it('should work with a single command', async () => {
    expect.assertions(4)
    const res = await makeCmdTasks('test', false, gitDir, ['test.js'])
    expect(res.length).toBe(1)
    const [linter] = res
    expect(linter.title).toBe('test')
    expect(linter.task).toBeInstanceOf(Function)
    const taskPromise = linter.task()
    expect(taskPromise).toBeInstanceOf(Promise)
    await taskPromise
  })

  it('should work with multiple commands', async () => {
    expect.assertions(9)
    const res = await makeCmdTasks(['test', 'test2'], false, gitDir, ['test.js'])
    expect(res.length).toBe(2)
    const [linter1, linter2] = res
    expect(linter1.title).toBe('test')
    expect(linter2.title).toBe('test2')

    let taskPromise = linter1.task()
    expect(taskPromise).toBeInstanceOf(Promise)
    await taskPromise
    expect(execa).toHaveBeenCalledTimes(1)
    expect(execa).lastCalledWith('test', ['test.js'], {
      preferLocal: true,
      reject: false,
      shell: false
    })
    taskPromise = linter2.task()
    expect(taskPromise).toBeInstanceOf(Promise)
    await taskPromise
    expect(execa).toHaveBeenCalledTimes(2)
    expect(execa).lastCalledWith('test2', ['test.js'], {
      preferLocal: true,
      reject: false,
      shell: false
    })
  })

  it('should work with function linter returning a string', async () => {
    const res = await makeCmdTasks(() => 'test', false, gitDir, ['test.js'])
    expect(res.length).toBe(1)
    expect(res[0].title).toEqual('test')
  })

  it('should work with function linter returning array of string', async () => {
    const res = await makeCmdTasks(() => ['test', 'test2'], false, gitDir, ['test.js'])
    expect(res.length).toBe(2)
    expect(res[0].title).toEqual('test')
    expect(res[1].title).toEqual('test2')
  })

  it('should work with function linter accepting arguments', async () => {
    const res = await makeCmdTasks(
      filenames => filenames.map(file => `test ${file}`),
      false,
      gitDir,
      ['test.js', 'test2.js']
    )
    expect(res.length).toBe(2)
    expect(res[0].title).toEqual('test test.js')
    expect(res[1].title).toEqual('test test2.js')
  })

  it('should work with array of mixed string and function linters', async () => {
    const res = await makeCmdTasks(
      [() => 'test', 'test2', files => files.map(file => `test ${file}`)],
      false,
      gitDir,
      ['test.js', 'test2.js', 'test3.js']
    )
    expect(res.length).toBe(5)
    expect(res[0].title).toEqual('test')
    expect(res[1].title).toEqual('test2')
    expect(res[2].title).toEqual('test test.js')
    expect(res[3].title).toEqual('test test2.js')
    expect(res[4].title).toEqual('test test3.js')
  })
})
