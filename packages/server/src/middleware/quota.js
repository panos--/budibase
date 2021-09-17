const CouchDB = require("../db")
const env = require("../environment")
const { getAllApps } = require("@budibase/auth/db")

const QuotaLimits = {
  APPS: 5,
  RECORDS_PER_APP: 1000,
}

const QuotaTypes = {
  APPS: "app",
  RECORDS: "records",
}

exports.QuotaTypes = QuotaTypes

exports.quotaMiddleware =
  type =>
  async (ctx, next, rows = 0) => {
    if (env.SELF_HOSTED) return next()

    const appId = ctx.appId

    if (type === QuotaTypes.APPS) {
      // app stuff
      const apps = await getAllApps(CouchDB, { dev: true })
      // fetch the number of apps
      if (apps.length >= QuotaLimits.APPS) {
        ctx.throw(
          400,
          `You have hit the limit of ${QuotaLimits.APPS} applications. Please delete an app.`
        )
      }
    }

    if (type === QuotaTypes.RECORDS) {
      const db = new CouchDB(appId, { skip_setup: true })
      const info = await db.info()
      const numberOfDocs = info.doc_count
      if (numberOfDocs + rows >= QuotaLimits.RECORDS_PER_APP) {
        ctx.throw(
          400,
          `You have hit the limit of ${QuotaLimits.RECORDS_PER_APP} records per app. Please delete records from this app to proceed.`
        )
      }
    }

    return next()
  }
