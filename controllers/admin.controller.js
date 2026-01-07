import User from "../models/user.model.js";
import Course from "../models/courses.model.js";
import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import AppResponse from "../utils/response.util.js";
import AppError from "../utils/error.util.js";

/**
 * GET /api/v1/admin/stats
 * Return aggregated admin dashboard statistics
 */
const getAdminStats = async (req, res, next) => {
  try {
    // basic counts
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "ADMIN" });
    const totalCourses = await Course.countDocuments();
    const totalPayments = await Payment.countDocuments();

    // Calculate monthly sales for last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

    const monthlySalesAgg = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          totalSales: { $sum: { $ifNull: ["$amount", 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // map into array [jan, feb, mar, ...] for 12 months
    const monthlySalesRecord = Array(12).fill(0);
    monthlySalesAgg.forEach((m) => {
      const monthIndex = m._id.month - 1; // 0-based
      monthlySalesRecord[monthIndex] = m.totalSales;
    });

    // subscription counts
    const activeSubscribers = await User.countDocuments({ "subscription.status": "active" });
    const createdSubscribers = await User.countDocuments({ "subscription.status": "created" });
    const pendingSubscribers = await User.countDocuments({ "subscription.status": "pending" });
    const cancelledSubscribers = await User.countDocuments({ "subscription.status": "cancelled" });

    // subscription breakdown (generic)
    const subscriptionBreakdownAgg = await User.aggregate([
      {
        $group: {
          _id: "$subscription.status",
          count: { $sum: 1 },
        },
      },
    ]);
    const subscriptionBreakdown = subscriptionBreakdownAgg.reduce((acc, cur) => {
      acc[cur._id ?? "none"] = cur.count;
      return acc;
    }, {});

    // total lectures across courses
    const lecturesAgg = await Course.aggregate([
      { $project: { lecturesCount: { $size: { $ifNull: ["$lectures", []] } } } },
      { $group: { _id: null, totalLectures: { $sum: "$lecturesCount" } } },
    ]);
    const totalLectures = lecturesAgg[0]?.totalLectures || 0;

    // total revenue (if Payment.amount exists)
    let totalRevenue = 0;
    try {
      const revAgg = await Payment.aggregate([
        { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } },
      ]);
      totalRevenue = revAgg[0]?.total || 0;
    } catch (e) {
      totalRevenue = 0;
    }

    // top courses by views (if field exists) fallback to numberOfLectures
    const topCourses = await Course.aggregate([
      {
        $project: {
          title: 1,
          numberOfLectures: { $ifNull: ["$numberOfLectures", { $size: { $ifNull: ["$lectures", []] } }] },
          views: { $ifNull: ["$views", 0] },
        },
      },
      { $sort: { views: -1, numberOfLectures: -1 } },
      { $limit: 5 },
    ]);

    // recent users
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt subscription");

    // monthly new users (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // include current month
    const monthlyNewUsersAgg = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1) } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    // normalize months into array
    const monthlyNewUsers = monthlyNewUsersAgg.map((m) => ({
      year: m._id.year,
      month: m._id.month,
      count: m.count,
    }));

    const stats = {
      users: {
        total: totalUsers,
        admins: totalAdmins,
        recent: recentUsers,
        monthlyNewUsers,
      },
      subscriptions: {
        active: activeSubscribers,
        created: createdSubscribers,
        pending: pendingSubscribers,
        cancelled: cancelledSubscribers,
        breakdown: subscriptionBreakdown,
      },
      courses: {
        total: totalCourses,
        totalLectures,
        topCourses,
      },
      payments: {
        totalPayments,
        totalRevenue,
        monthlySalesRecord,
      },
      generatedAt: new Date(),
    };

    return res.status(200).json(new AppResponse(200, stats, "Admin dashboard stats fetched"));
  } catch (error) {
    console.error("Admin stats error:", error);
    return next(new AppError(500, "Failed to fetch admin statistics"));
  }
};

export { getAdminStats };