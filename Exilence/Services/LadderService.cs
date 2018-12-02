using Exilence.Helper;
using Exilence.Interfaces;
using Exilence.Models;
using Exilence.Models.Ladder;
using Exilence.Store;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Exilence.Services
{
    public class LadderService : ILadderService
    {
        private readonly IHostingEnvironment _env;
        private readonly ILogger<LadderService> _log;
        private readonly IExternalService _externalService;

        private const string LadderUrl = "http://www.pathofexile.com/api/ladders";
        private const string LeagesUrl = "http://api.pathofexile.com/leagues?type=main&compact=1";
        private const string PoeNinjaStatsUrl = "http://poe.ninja/api/Data/GetStats";
        private const string TradeUrl = "http://api.pathofexile.com/public-stash-tabs";

        public LadderService(ILogger<LadderService> log, IExternalService externalService, IHostingEnvironment env)
        {
            _log = log;
            _env = env;
            _externalService = externalService;
        }

        #region Leagues
        private async Task<List<LeagueApiModel>> FetchLeaguesAsync()
        {
            var json = await _externalService.ExecuteGetAsync(LeagesUrl);
            return JsonConvert.DeserializeObject<List<LeagueApiModel>>(json);
        }

        #endregion

        #region Ladder

        public List<LadderPlayerModel> GetLadderForLeague(string league, bool full = false)
        {
            if (LadderStore.GetLadderStatus(league) == null)
            {
                LadderStore.SetLadderPending(league);
            }
            else
            {
                var leagueLadder = LadderStore.GetLadder(league);
                if (full)
                {
                    return leagueLadder.OrderBy(t => t.Rank.Overall).ToList();
                }
                else
                {
                    return leagueLadder.OrderBy(t => t.Rank.Overall).Take(10).ToList();
                }
            }

            return null;
        }

        public List<LadderPlayerModel> GetLadderForPlayer(string league, string character)
        {
            var characterOnLadder = GetCharacterFromLadder(league, character);
            if (characterOnLadder != null)
            {
                var leagueLadder = LadderStore.GetLadder(league);
                var index = leagueLadder.IndexOf(characterOnLadder);
                return GetPartOfLadder(index - 5, index + 5, leagueLadder);
            }

            return null;
        }

        public List<LadderPlayerModel> GetGroupDepthLadderForPlayer(string league, string character)
        {
            var characterOnLadder = GetCharacterFromLadder(league, character);
            if (characterOnLadder != null)
            {
                var leagueLadder = LadderStore.GetLadder(league).OrderByDescending(t => t.Depth.Group).ToList();
                var index = leagueLadder.IndexOf(characterOnLadder);
                return GetPartOfLadder(index - 5, index + 5, leagueLadder);
            }
            return null;
        }

        public List<LadderPlayerModel> GetSoloDepthLadderForPlayer(string league, string character)
        {
            var characterOnLadder = GetCharacterFromLadder(league, character);
            if (characterOnLadder != null)
            {
                var leagueLadder = LadderStore.GetLadder(league).OrderByDescending(t => t.Depth.Solo).ToList();
                var index = leagueLadder.IndexOf(characterOnLadder);
                return GetPartOfLadder(index - 5, index + 5, leagueLadder);
            }
            return null;
        }

        public List<LadderPlayerModel> GetClassLadderForPlayer(string league, string character)
        {
            var characterOnLadder = GetCharacterFromLadder(league, character);
            if (characterOnLadder != null)
            {
                var leagueLadder = LadderStore.GetLadder(league)
                    .Where(t => t.Class == characterOnLadder.Class)
                    .OrderBy(t => t.Rank.Class)
                    .ToList();

                var index = leagueLadder.IndexOf(characterOnLadder);
                return GetPartOfLadder(index - 5, index + 5, leagueLadder);
            }

            return null;
        }

        public List<LadderPlayerModel> GetPartOfLadder(int from, int to, List<LadderPlayerModel> ladder)
        {
            var result = new List<LadderPlayerModel>();

            for (int i = from; i <= to; i++)
            {
                var element = ladder.ElementAtOrDefault(i);
                if (element != null)
                {
                    result.Add(element);
                }
            }
            return result;
        }

        public LadderPlayerModel GetCharacterFromLadder(string league, string character)
        {
            if (LadderStore.GetLadderStatus(league) == null)
            {
                LadderStore.SetLadderPending(league);
            }
            else
            {
                var leagueLadder = LadderStore.GetLadder(league);
                var characterOnLadder = leagueLadder.FirstOrDefault(t => t.Name == character);
                return characterOnLadder;
            }

            return null;
        }


        public void UpdateLadders()
        {
            var anyRunning = LadderStore.AnyRunning();
            if (!anyRunning)
            {
                var pendingLeague = LadderStore.GetNextForUpdate();
                if (pendingLeague != null)
                {
                    var pendingStatus = LadderStore.GetLadderStatus(pendingLeague);
                    if (pendingStatus.Finished < DateTime.Now.AddMinutes(-5))
                    {
                        UpdateLadder(pendingLeague);
                    }
                }
            }
        }

        private async void UpdateLadder(string league)
        {
            LadderStore.SetLadderRunning(league);

            var oldLadder = LadderStore.GetLadder(league);
            var newLadder = new List<LadderPlayerModel>();

            var pages = Enumerable.Range(0, 5);
            using (var rateGate = new RateGate(2, TimeSpan.FromSeconds(1)))
            {
                foreach (int page in pages)
                {
                    await rateGate.WaitToProceed();
                    LadderApiResponse result = await FetchLadderApiPage(league, page);
                    if (result != null)
                    {
                        var LadderPlayerList = result.Entries.Select(t => new LadderPlayerModel()
                        {
                            Name = t.Character.Name,
                            Level = t.Character.Level,
                            Online = t.Online,
                            Dead = t.Dead,
                            Account = t.Account.Name,
                            Experience = t.Character.Experience,
                            ExperiencePerHour = 0,
                            Rank = new LadderPlayerRankModel()
                            {
                                Overall = t.Rank
                            },
                            Depth = new LadderPlayerDepthModel()
                            {
                                Solo = t.Character.Depth != null ? t.Character.Depth.Solo : 0,
                                Group = t.Character.Depth != null ? t.Character.Depth.@default : 0
                            },
                            Twitch = t.Account.Twitch?.Name,
                            Class = t.Character.Class,
                            Updated = DateTime.Now
                        }).ToList();
                        // Convert result to LadderPlayer model here
                        newLadder.AddRange(LadderPlayerList);
                        if (newLadder.Count == result.Total || result.Entries.Count == 0)
                        {
                            break;
                        }
                    }
                    else
                    {
                        LadderStore.RemoveLadderStatus(league);
                        break;
                    }
                }
            }

            if (newLadder.Count > 0)
            {
                newLadder = CalculateStatistics(oldLadder, newLadder);

                LadderStore.SetLadder(league, newLadder);
                LadderStore.SetLadderFinished(league);
            }
        }

        private List<LadderPlayerModel> CalculateStatistics(List<LadderPlayerModel> oldLadder, List<LadderPlayerModel> newLadder)
        {
            foreach (var newEntry in newLadder)
            {
                newEntry.Depth.Group = newLadder.Count(t => t.Depth.Group > newEntry.Depth.Group) + 1;
                newEntry.Depth.Solo = newLadder.Count(t => t.Depth.Solo > newEntry.Depth.Solo) + 1;
                newEntry.Rank.Class = newLadder.Where(t => t.Class == newEntry.Class).Where(x => x.Rank.Overall < newEntry.Rank.Overall).Count() + 1;

                var oldLadderEntry = oldLadder.FirstOrDefault(t => t.Name == newEntry.Name);
                if (oldLadderEntry != null && oldLadderEntry.Updated != DateTime.MinValue)
                {
                    var expGain = newEntry.Experience - oldLadderEntry.Experience;
                    var oneHour = (1 * 60 * 60);
                    var timeBetweenUpdates = newEntry.Updated.ToUnixTimeStamp() - oldLadderEntry.Updated.ToUnixTimeStamp();
                    var gainOverTime = (oneHour / timeBetweenUpdates) * expGain;
                    newEntry.ExperiencePerHour = (long)gainOverTime;
                }
            }
            return newLadder;
        }

        public async Task<LadderApiResponse> FetchLadderApiPage(string league, int page)
        {
            var offset = page * 200;
            league = HttpUtility.UrlEncode(league);
            var urlParams = $"offset={offset}&limit=200&id={league}&type=league";
            var url = $"{LadderUrl}?{urlParams}";
            var apiResponse = await HandleLadderRequest(url);
            return apiResponse;
        }

        private async Task<LadderApiResponse> HandleLadderRequest(string url)
        {
            string json = await _externalService.ExecuteGetAsync(url);
            if (json != null)
            {
                return JsonConvert.DeserializeObject<LadderApiResponse>(json);
            }
            return null;
        }


        #endregion

    }
}
