﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ExileParty
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseKestrel(options =>
                {
                    options.Listen(IPAddress.Any, 80);
                })
                .ConfigureLogging((hostingContext, builder) =>
                {
                    
                    builder.AddFilter((provider, category, logLevel) =>
                    {
                        if (
                        logLevel == LogLevel.Trace ||
                        logLevel == LogLevel.Debug ||
                        category == "Hangfire.BackgroundJobServer" ||
                        category == " Hangfire.Processing.BackgroundExecution" || 
                        category == "Hangfire.Server.BackgroundServerProcess")
                        {
                            return false;
                        }

                        return true;
                    });
                    builder.AddFile("Logs/ExileParty-{Date}.txt");
                })
                .UseStartup<Startup>();
    }
}