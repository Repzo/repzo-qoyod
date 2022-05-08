"use strict";
db.getCollection("sv.fullinvoices").aggregate([
    {
        $match: {
            time: {
                $lte: Date.now() - 1000 * 60 * 60 * 24 * 10,
                $gte: Date.now() - 1000 * 60 * 60 * 24 * 11
            },
            company_namespace: ["alfares"]
        }
    },
    {
        $lookup: {
            from: "sv.transactions",
            let: { sn: "$serial_number.formatted", ns: "$company_namespace" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$company_namespace", "$$ns"] },
                                { $gte: ["$parcel.meta.serial_number.formatted", "$$sn"] }
                            ]
                        }
                    }
                },
                { $limit: 1 }
            ],
            //      localField:"serial_number.formatted",
            //      foreignField:"parcel.meta.serial_number.formatted",
            as: "transactions"
        }
    },
    {
        $set: {
            numberOfTransactions: {
                $cond: {
                    if: { $isArray: "$transactions" },
                    then: { $size: "$transactions" },
                    else: 0
                }
            }
        }
    },
    { $match: { numberOfTransactions: { $eq: 0 } } }
    // {$count:"count"},
]);
